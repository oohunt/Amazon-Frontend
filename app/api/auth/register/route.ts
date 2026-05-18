import bcryptjs from 'bcryptjs';
import type { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// 使用纯JavaScript实现的bcryptjs代替bcrypt，避免原生模块加载问题

import { ensureTemplateExists } from '@/lib/email/email-template-init';
import { EMAIL_TEMPLATE_TYPES } from '@/lib/email/email-template-types';
import { getCompiledEmailTemplate } from '@/lib/email/email-templates';
import type { User } from '@/lib/models/User';
import { UserRole, isAdminAccount, isSuperAdminAccount } from '@/lib/models/UserRole';
import clientPromise from '@/lib/mongodb';

// 懒初始化Resend - 仅在实际发送邮件时创建实例
function getResend() {
    return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}

export async function POST(request: Request) {
    try {
        // 解析请求体获取注册信息
        const { name, email, password } = await request.json();

        // 基本验证
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // 电子邮件格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const clientPromiseWithTimeout = Promise.race([
            clientPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout')), 30000)
            )
        ]) as Promise<MongoClient>;

        const client = await clientPromiseWithTimeout;
        const db = client.db(process.env.MONGODB_DB || "oohunt");

        // 检查电子邮件是否已在使用中
        const existingUser = await db.collection('users').findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { error: 'This email is already registered' },
                { status: 409 }
            );
        }

        // 使用bcryptjs对密码进行哈希处理
        const saltRounds = 10;
        const hashedPassword = await bcryptjs.hash(password, saltRounds);

        // 确定用户角色
        let role = UserRole.USER;

        // 首先检查是否为超级管理员账户
        if (isSuperAdminAccount(email)) {
            role = UserRole.SUPER_ADMIN;
        }
        // 然后检查是否为普通管理员账户
        else if (isAdminAccount(email)) {
            role = UserRole.ADMIN;
        }

        // 创建用户
        const newUser: Omit<User, '_id'> = {
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // 发送注册确认邮件
        try {
            // 尝试从数据库获取并编译邮件模板，使用模板类型查询
            const templateResult = await getCompiledEmailTemplate(
                EMAIL_TEMPLATE_TYPES.USER_REGISTRATION,
                {
                    name,
                    email,
                    date: new Date()
                },
                true // 标记为按类型查询
            );

            // 准备发送邮件的配置
            const emailConfig = {
                from: 'onboarding@resend.dev', // 默认发件人
                to: [email],
                subject: 'Welcome to OOHUNT! Account Registration',
                html: `<p>Hello ${name}, thank you for registering!</p>` // 默认简单内容
            };

            // 如果成功获取到模板，则使用模板内容
            if (templateResult.success) {
                emailConfig.subject = templateResult.subject || emailConfig.subject;
                emailConfig.html = templateResult.html || emailConfig.html;

                // 如果模板指定了发件人且环境不是开发环境，则使用模板中的发件人
                if (templateResult.from && process.env.NODE_ENV !== 'development') {
                    emailConfig.from = templateResult.from;
                }
            } else {
                // 如果模板不存在或未激活，尝试创建默认模板
                await ensureTemplateExists(EMAIL_TEMPLATE_TYPES.USER_REGISTRATION);
            }

            // 使用Resend发送确认邮件
            await getResend().emails.send(emailConfig);
        } catch (emailError) {
            return NextResponse.json({
                success: false,
                message: 'Failed to send registration email',
                error: emailError instanceof Error ? emailError.message : 'Unknown error'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertedId,
            role
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Registration error:', error);

        // 处理特定错误类型
        if (error instanceof Error) {
            if (error.message === 'Database connection timeout') {
                return NextResponse.json(
                    { error: 'Unable to connect to the database. Please try again later.' },
                    { status: 503 }
                );
            }

            if (error.message.includes('timed out after') || error.message.includes('ETIMEDOUT')) {
                return NextResponse.json(
                    { error: 'Database connection timed out. Please try again later.' },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
} 