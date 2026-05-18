import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import clientPromise from '@/lib/mongodb';

// 懒初始化Resend - 仅在实际发送邮件时创建实例
function getResend() {
    return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}

// 判断是否启用邮件通知功能（默认启用）
const enableEmailNotification = process.env.ENABLE_CONTACT_EMAIL_NOTIFICATION !== 'false';

// 联系表单提交API
export async function POST(request: Request) {
    try {
        const { name, email, subject, message, formSource, formId, phone } = await request.json();

        // 验证必填字段
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // 连接到MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('contact_messages');

        // 将联系信息保存到数据库
        await collection.insertOne({
            name,
            email,
            subject,
            message,
            phone,
            formSource,
            formId,
            createdAt: new Date(),
            read: false,
            isProcessed: false,
        });

        // 如果来源是邮件订阅表单，同时添加到订阅列表
        if (formSource === 'general' || formSource === 'blog') {
            try {
                const subscriptionCollection = db.collection('subscriptions');

                // 检查是否已存在相同邮箱
                const existingSubscription = await subscriptionCollection.findOne({ email });

                if (existingSubscription) {
                    // 更新已有订阅
                    await subscriptionCollection.updateOne(
                        { email },
                        {
                            $set: {
                                updatedAt: new Date(),
                                lastFormId: formId || null,
                            },
                            $addToSet: {
                                sourceTypes: formSource
                            }
                        }
                    );
                } else {
                    // 创建新订阅
                    await subscriptionCollection.insertOne({
                        email,
                        sourceTypes: [formSource],
                        formId: formId || null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isActive: true
                    });
                }
            } catch {

                // 继续处理，不影响主流程
            }
        }

        // 发送通知邮件给管理员（如果启用了该功能）
        if (enableEmailNotification && process.env.RESEND_API_KEY) {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@oohunt.com';

            try {
                await getResend().emails.send({
                    from: 'noreply@oohunt.com',
                    to: adminEmail,
                    subject: `New ${formSource ? `${formSource} form` : 'contact form'} message: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #16A085;">New ${formSource ? `${formSource} form` : 'contact form'} message</h1>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                            <p><strong>Subject:</strong> ${subject}</p>
                            ${formSource ? `<p><strong>Form Source:</strong> ${formSource}</p>` : ''}
                            ${formId ? `<p><strong>Form ID:</strong> ${formId}</p>` : ''}
                            <p><strong>Message:</strong></p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    `,
                });
            } catch {
                // 仅记录邮件发送失败的错误，不影响表单提交成功
            }
        }

        // 根据表单来源返回不同的成功消息
        let successMessage = 'Your message has been sent successfully, we will reply to you as soon as possible!';

        if (formSource === 'general' || formSource === 'blog') {
            successMessage = 'Thank you for subscribing! You will receive the latest news and offers.';
        }

        return NextResponse.json(
            { success: true, message: successMessage },
            { status: 200 }
        );
    } catch {

        return NextResponse.json(
            { success: false, message: 'Failed to submit the form' },
            { status: 500 }
        );
    }
} 