'use client';

import { Input, Textarea, Button, Switch, Select, SelectItem, DateInput, Form, NumberInput } from "@heroui/react";
import { zodResolver } from '@hookform/resolvers/zod';
import { parseAbsolute, toCalendarDateTime, type CalendarDateTime, type CalendarDate, type ZonedDateTime } from '@internationalized/date';
import { TrashIcon, Shuffle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, type SubmitHandler, type Resolver } from 'react-hook-form';
import * as z from 'zod';

import { revalidateProductsList } from '@/app/actions/revalidateProducts';
import CoverImageUploader from '@/components/dashboard/cms/pages/CoverImageUploader';
import { productsApi } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { getCurrentUTCTimeString } from '@/lib/utils';
import type { ProductInfo, ProductOffer } from '@/types/api';

// Define supported internationalized date types
type InternationalizedDateValue = CalendarDate | CalendarDateTime | ZonedDateTime | null;

// Date conversion function: convert ISO string to CalendarDateTime object
const parseISOStringToCalendarDateTime = (isoString: string | null | undefined): CalendarDateTime | null => {
    if (!isoString || typeof isoString !== 'string') return null;
    try {
        // Parse UTC ISO string and convert to user's local timezone CalendarDateTime for display
        const zonedDateTime = parseAbsolute(isoString, Intl.DateTimeFormat().resolvedOptions().timeZone);

        return toCalendarDateTime(zonedDateTime);
    } catch {
        return null;
    }
};

// Convert internationalized date object to UTC ISO string
const formatInternationalizedDateToISO = (dateValue: InternationalizedDateValue): string | undefined => {
    if (!dateValue) return undefined;
    try {
        // Ensure conversion to UTC time for storage
        const jsDate = dateValue.toDate('UTC');

        return jsDate.toISOString();
    } catch {
        return undefined;
    }
};

// Define Zod schema for Offer
const productOfferSchema = z.object({
    condition: z.string().min(1, { message: 'Condition is required' }).default('New'),
    price: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '' ? parseFloat(val) : typeof val === 'number' ? val : undefined),
        z.number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' }).positive({ message: 'Price must be positive' })
    ),
    currency: z.string().min(1, { message: 'Currency is required' }).default('USD'),
    availability: z.string().min(1, { message: 'Availability is required' }),
    merchant_name: z.string().min(1, { message: 'Merchant Name is required' }),
    original_price: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '' ? parseFloat(val) : typeof val === 'number' ? val : undefined),
        z.number().positive().optional()
    ),
    savings: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '' ? parseFloat(val) : typeof val === 'number' ? val : undefined),
        z.number().positive().optional()
    ),
    savings_percentage: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined),
        z.number().int().min(0).max(100).optional()
    ),
    is_prime: z.boolean().optional().default(false),
    coupon_type: z.enum(['percentage', 'fixed']).optional().nullable(),
    coupon_value: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '' ? parseFloat(val) : typeof val === 'number' ? val : undefined),
        z.number().positive().optional()
    ),
    commission: z.string().optional(),
});

// Define base ProductInfo Zod schema
const baseProductInfoSchema = z.object({
    asin: z.string().optional(),
    title: z.string().min(1, { message: 'Title is required' }),
    url: z.string().url({ message: 'Invalid URL format' }),
    offers: z.array(productOfferSchema).min(1, { message: 'At least one offer is required' }),
    brand: z.string().optional(),
    main_image: z.preprocess(
        (val: unknown) => {
            // If value is empty string, null, or undefined, return undefined to indicate no value provided
            if (typeof val === 'string' && val.trim() === '') return undefined;
            if (val === null || val === undefined) return undefined;

            return val;
        },
        z.string().url({ message: 'Invalid URL format' }).optional()
    ),
    timestamp: z.string().optional(),
    binding: z.string().optional(),
    product_group: z.string().optional(),
    categories: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val.length > 0 ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
        z.array(z.string()).optional()
    ),
    browse_nodes: z.preprocess(
        (val: unknown) => {
            if (typeof val === 'string' && val.trim().startsWith('[')) {
                try { return JSON.parse(val); } catch { /* ignore error */ }
            }

            return undefined;
        },
        z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })).optional()
    ),
    features: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val.length > 0 ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
        z.array(z.string()).optional()
    ),
    cj_url: z.preprocess(
        (val: unknown) => {
            // If value is empty string, null, or undefined, return undefined to indicate no value provided
            if (typeof val === 'string' && val.trim() === '') return undefined;
            if (val === null || val === undefined) return undefined;

            return val;
        },
        z.string().url({ message: 'Invalid URL format' }).optional()
    ),
    api_provider: z.enum(['amazon', 'walmart', 'bestbuy', 'target', 'ebay', 'pa-api', 'cj-api'], { invalid_type_error: 'Invalid API provider' }).optional().default('amazon'),
    source: z.enum(['coupon', 'discount'], { invalid_type_error: 'Invalid source' }).optional().default('coupon'),
    coupon_expiration_date: z.any().optional().nullable(),
    coupon_terms: z.string().optional(),
    raw_data: z.preprocess(
        (val: unknown) => {
            if (typeof val === 'string' && val.trim().startsWith('{')) {
                try { return JSON.parse(val); } catch { /* ignore error */ }
            }

            return undefined;
        },
        z.record(z.unknown()).optional()
    ),
});

// Function to create dynamic schema based on mode
const createProductInfoSchema = (mode: 'add' | 'edit') => {
    // ASIN format validation: 10-character alphanumeric string
    const asinValidation = z.string()
        .regex(/^[A-Z0-9]{10}$/, { message: 'ASIN must be exactly 10 characters (letters and numbers only)' });

    return baseProductInfoSchema.extend({
        asin: mode === 'add'
            ? asinValidation
            : z.string().optional()
    });
};

// Infer TypeScript types from Zod schema
type ProductFormData = z.infer<typeof baseProductInfoSchema>;

// Helper type for offer mapping
type MappedOffer = Omit<ProductOffer, 'price'> & { price: number };

// Extended ProductOffer type to include additional fields for form handling
type _ExtendedProductOffer = ProductOffer & {
    original_price?: number;
    savings?: number;
    savings_percentage?: number;
    coupon_type?: "percentage" | "fixed" | null;
    coupon_value?: number;
    commission?: string;
};

// Helper type for form data formatting
type _FormattedData = Partial<ProductFormData> & {
    categories?: string;
    features?: string;
    browse_nodes?: string;
    raw_data?: string;
};

// Product form component props interface
interface ProductFormProps {
    mode: 'add' | 'edit';
    initialData?: Partial<ProductFormData>; // Use more specific type instead of any
    asin?: string; // ASIN in edit mode
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
    mode,
    initialData,
    asin,
    onSuccess,
    onCancel
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    // Generate Amazon-format ASIN (10-character alphanumeric)
    const generateASIN = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const alphanumeric = letters + numbers;

        let result = '';

        // Amazon ASINs typically start with B (~75% of cases), occasionally start with other letters
        if (Math.random() < 0.75) {
            result = 'B';
        } else {
            result = letters.charAt(Math.floor(Math.random() * letters.length));
        }

        // Generate remaining 9 characters, mixing letters and numbers
        for (let i = 0; i < 9; i++) {
            // First few positions tend to use numbers, last few mix characters
            if (i < 3 && Math.random() < 0.6) {
                result += numbers.charAt(Math.floor(Math.random() * numbers.length));
            } else {
                result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
            }
        }

        return result;
    };

    // Handle generate ASIN button click
    const handleGenerateASIN = () => {
        if (mode === 'edit') return; // Do not allow generating new ASIN in edit mode

        const newASIN = generateASIN();
        // Use setValue to update form field value

        setValue('asin', newASIN);
    };

    // Handle initial data formatting
    const formatInitialData = (data?: Partial<ProductFormData>): Record<string, unknown> => {
        if (!data) return {};

        return {
            ...data,
            // Ensure array fields are correctly formatted as comma-separated strings
            categories: Array.isArray(data.categories) ? data.categories.join(', ') : (data.categories || ''),
            features: Array.isArray(data.features) ? data.features.join(', ') : (data.features || ''),
            // Ensure JSON fields are correctly serialized
            browse_nodes: data.browse_nodes ? (typeof data.browse_nodes === 'string' ? data.browse_nodes : JSON.stringify(data.browse_nodes)) : '',
            raw_data: data.raw_data ? (typeof data.raw_data === 'string' ? data.raw_data : JSON.stringify(data.raw_data)) : '',
            // Correctly handle date fields: convert ISO string to Date object
            coupon_expiration_date: parseISOStringToCalendarDateTime(data.coupon_expiration_date as string) || null,
        };
    };

    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
        reset,
        setValue,
    } = useForm<ProductFormData>({
        resolver: zodResolver(createProductInfoSchema(mode)) as Resolver<ProductFormData>,
        defaultValues: {
            asin: initialData?.asin || '',
            title: initialData?.title || '',
            url: initialData?.url || '',
            offers: initialData?.offers || [{
                condition: 'New',
                price: 0.01,
                currency: 'USD',
                availability: 'In Stock',
                merchant_name: '',
                is_prime: false,
                coupon_type: null,
            }],
            brand: initialData?.brand || '',
            main_image: initialData?.main_image || '',
            binding: initialData?.binding || '',
            product_group: initialData?.product_group || '',
            categories: initialData?.categories || [],
            features: initialData?.features || [],
            browse_nodes: initialData?.browse_nodes || undefined,
            raw_data: initialData?.raw_data || undefined,
            cj_url: initialData?.cj_url || '',
            api_provider: initialData?.api_provider || 'amazon',
            source: initialData?.source || 'coupon',
            coupon_expiration_date: parseISOStringToCalendarDateTime(initialData?.coupon_expiration_date as string) || null,
            coupon_terms: initialData?.coupon_terms || '',
        },
    });

    // Reset form when initial data changes
    useEffect(() => {
        if (initialData) {
            const formattedData = formatInitialData(initialData);

            reset(formattedData);
        }
    }, [initialData, reset]);

    // useFieldArray for managing dynamic offers array
    const { fields: offerFields, append: appendOffer, remove: removeOffer } = useFieldArray({
        control,
        name: "offers",
    });

    // Form submit handler function
    const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
        setIsLoading(true);
        setServerErrors({});

        // Get current UTC timestamp string — always use UTC for storage
        const currentTimestamp = getCurrentUTCTimeString();

        // Format data to match API expected ProductInfo structure
        const formattedData: ProductInfo = {
            ...data,
            asin: mode === 'edit' && asin ? asin : (data.asin ?? ''),
            browse_nodes: data.browse_nodes || undefined,
            raw_data: data.raw_data || undefined,
            timestamp: currentTimestamp,
            // Convert user-input date to UTC ISO string for storage
            coupon_expiration_date: formatInternationalizedDateToISO(data.coupon_expiration_date as InternationalizedDateValue),
            offers: data.offers.map((offer: ProductFormData['offers'][number]) => ({
                ...offer,
                price: typeof offer.price === 'number' && offer.price > 0 ? offer.price :
                    (() => { throw new Error('Price must be a valid number'); })(),
                coupon_type: offer.coupon_type ?? undefined,
            } as MappedOffer)),
        };

        try {
            let response;

            if (mode === 'add') {
                response = await productsApi.manualAddProduct(formattedData);
            } else {
                if (!asin) {
                    throw new Error('ASIN is required for editing mode');
                }
                response = await productsApi.updateProduct(asin, formattedData);
            }

            // Backend may return 200 OK or 201 Created
            if (response.status === 201 || response.status === 200) {
                showSuccessToast({
                    title: 'Success!',
                    description: mode === 'add' ? 'Product added successfully.' : 'Product updated successfully.',
                });

                if (mode === 'add') {
                    reset(); // Reset form in add mode
                }

                // Trigger cache revalidation
                try {
                    await revalidateProductsList();
                } catch {
                    showErrorToast({
                        title: 'Cache Revalidation Pending',
                        description: 'Product list may take a moment to update.'
                    });
                }

                // Call success callback
                onSuccess?.();
            } else {
                const errorMessage = (response.data as { message?: string; detail?: string })?.message ||
                    (response.data as { message?: string; detail?: string })?.detail ||
                    `Failed to ${mode} product. Unexpected status.`;

                showErrorToast({
                    title: `Error: ${response.status || 'Request Failed'}`,
                    description: errorMessage,
                });
            }
        } catch (error: unknown) {
            let errorMessage = 'An unexpected error occurred.';

            // Handle Axios error
            const axiosError = error as {
                response?: {
                    data?: { detail?: string | Array<{ loc: string[]; msg: string; type: string }> };
                    status?: number
                };
                request?: unknown;
                message?: string
            };

            if (axiosError.response) {
                const detail = axiosError.response.data?.detail;
                const status = axiosError.response.status;

                if (status === 409) {
                    errorMessage = (typeof detail === 'string' ? detail : '') || 'ASIN already exists.';
                    setServerErrors({ asin: errorMessage });
                } else if (status === 404 && mode === 'edit') {
                    errorMessage = (typeof detail === 'string' ? detail : '') || 'Product not found.';
                } else if (status === 400) {
                    errorMessage = (typeof detail === 'string' ? detail : '') || 'Invalid data provided.';
                } else if (status === 422) {
                    if (Array.isArray(detail)) {
                        try {
                            const errors: Record<string, string> = {};

                            detail.forEach(err => {
                                const fieldPath = err.loc.slice(1).join('.');

                                errors[fieldPath] = err.msg;
                            });
                            setServerErrors(errors);
                            errorMessage = 'Please correct the errors in the form.';
                        } catch {
                            errorMessage = JSON.stringify(detail);
                        }
                    } else {
                        errorMessage = detail || 'Validation failed.';
                    }
                } else if (status === 500) {
                    errorMessage = (typeof detail === 'string' ? detail : '') || 'Internal server error.';
                } else {
                    errorMessage = (typeof detail === 'string' ? detail : '') || `Server error: ${status}`;
                }
            } else if (axiosError.request) {
                errorMessage = 'No response received from server.';
            } else if (axiosError.message) {
                errorMessage = axiosError.message;
            }

            showErrorToast({
                title: 'Error',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
            validationBehavior="aria"
            validationErrors={serverErrors}
        >
            {/* Section A: Basic info */}
            <div id="basic-information" className="border rounded-md p-4 space-y-4 md:col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                    {/* ASIN field - Add generate button */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium">
                            ASIN {mode === 'add' && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex space-x-2">
                            <Controller
                                name="asin"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Enter 10-character ASIN (e.g., B08N5WRWNW)"
                                        isRequired={mode === 'add'}
                                        isDisabled={mode === 'edit'} // Disable ASIN field in edit mode
                                        isInvalid={!!errors.asin}
                                        errorMessage={errors.asin?.message}
                                        variant="bordered"
                                        className="flex-1"
                                        maxLength={10}
                                    />
                                )}
                            />
                            {mode === 'add' && (
                                <Button
                                    isIconOnly
                                    variant="bordered"
                                    onPress={handleGenerateASIN}
                                    className="shrink-0"
                                    title="Generate random ASIN"
                                >
                                    <Shuffle className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        {errors.asin && (
                            <p className="text-xs text-danger">{errors.asin.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            ASIN must be exactly 10 characters (letters and numbers only).
                            {mode === 'add' && ' Click the shuffle button to generate a random ASIN.'}
                        </p>
                    </div>
                    <Input
                        {...register("title")}
                        label="Title"
                        placeholder="Enter product title"
                        isRequired
                        isInvalid={!!errors.title}
                        errorMessage={errors.title?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                    <Input
                        {...register("url")}
                        label="Source URL"
                        placeholder="https://www.example.com/product/..."
                        type="url"
                        isRequired
                        isInvalid={!!errors.url}
                        errorMessage={errors.url?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                    <Input
                        {...register("brand")}
                        label="Brand"
                        placeholder="Enter brand name (optional)"
                        isInvalid={!!errors.brand}
                        errorMessage={errors.brand?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                </div>
            </div>

            {/* Section C: More product info */}
            <div id="additional-information" className="border rounded-md p-4 space-y-4 md:col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                <div className="grid grid-cols-1 gap-6">
                    <Input
                        {...register("binding")}
                        label="Binding"
                        placeholder="e.g., Electronics (optional)"
                        isInvalid={!!errors.binding}
                        errorMessage={errors.binding?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                    <Input
                        {...register("product_group")}
                        label="Product Group"
                        placeholder="e.g., Test Products (optional)"
                        isInvalid={!!errors.product_group}
                        errorMessage={errors.product_group?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                    <Input
                        {...register("cj_url")}
                        label="CJ Affiliate URL"
                        placeholder="https://... (optional)"
                        type="url"
                        isInvalid={!!errors.cj_url}
                        errorMessage={errors.cj_url?.message}
                        labelPlacement="outside-left"
                        variant="bordered"
                        className="w-full"
                        classNames={{ inputWrapper: "flex-1" }}
                    />
                    <Controller
                        name="api_provider"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="API Provider"
                                placeholder="Select API provider"
                                selectedKeys={field.value ? [field.value] : []}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                isInvalid={!!errors.api_provider}
                                errorMessage={errors.api_provider?.message}
                                labelPlacement="outside-left"
                                variant="bordered"
                                className="w-full"
                                classNames={{ trigger: "flex-1" }}
                            >
                                <SelectItem key="amazon">Amazon</SelectItem>
                                <SelectItem key="walmart">Walmart</SelectItem>
                                <SelectItem key="bestbuy">Best Buy</SelectItem>
                                <SelectItem key="target">Target</SelectItem>
                                <SelectItem key="ebay">eBay</SelectItem>
                                <SelectItem key="pa-api">PA-API</SelectItem>
                                <SelectItem key="cj-api">CJ-API</SelectItem>
                            </Select>
                        )}
                    />
                    <Controller
                        name="source"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Discount Type"
                                placeholder="Select data source"
                                selectedKeys={field.value ? [field.value] : []}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                isInvalid={!!errors.source}
                                errorMessage={errors.source?.message}
                                labelPlacement="outside-left"
                                variant="bordered"
                                className="w-full"
                                classNames={{ trigger: "flex-1" }}
                            >
                                <SelectItem key="coupon">Coupon</SelectItem>
                                <SelectItem key="discount">Discount</SelectItem>
                            </Select>
                        )}
                    />
                </div>
            </div>

            {/* Section B: Image upload */}
            <div className="border rounded-md p-4 space-y-4 md:col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Cover Image</h3>
                <Controller
                    name="main_image"
                    control={control}
                    render={({ field }) => (
                        <CoverImageUploader
                            currentImageUrl={field.value || ''}
                            onImageUploaded={(url) => field.onChange(url)}
                        />
                    )}
                />
                {errors.main_image && (
                    <p className="mt-1 text-xs text-red-500">{errors.main_image.message}</p>
                )}
            </div>

            {/* Section D: Category and features */}
            <div className="border rounded-md p-4 space-y-4 md:col-span-2 lg:col-span-6">
                <h3 className="text-lg font-semibold mb-2">Categories & Features</h3>
                <div className="space-y-4">
                    <Textarea
                        {...register("categories")}
                        label="Categories (comma-separated, optional)"
                        placeholder="e.g., Electronics, Test Category"
                        isInvalid={!!errors.categories}
                        errorMessage={errors.categories?.message as string | undefined}
                        variant="bordered"
                    />
                    <Textarea
                        {...register("features")}
                        label="Features (comma-separated, optional)"
                        placeholder="e.g., Feature 1, Feature 2"
                        isInvalid={!!errors.features}
                        errorMessage={errors.features?.message as string | undefined}
                        variant="bordered"
                    />
                    <Textarea
                        {...register("browse_nodes")}
                        label="Browse Nodes (JSON Array, optional)"
                        placeholder="e.g., [{&quot;id&quot;: &quot;123&quot;, &quot;name&quot;: &quot;Test Node&quot;}]"
                        isInvalid={!!errors.browse_nodes}
                        errorMessage={errors.browse_nodes ? `Must be a valid JSON array like '[{"id": "...", "name": "..."}]'` : undefined}
                        variant="bordered"
                        minRows={2}
                    />
                    <Textarea
                        {...register("raw_data")}
                        label="Raw Data (JSON Object, optional)"
                        placeholder="e.g., {&quot;key&quot;: &quot;value&quot;}"
                        isInvalid={!!errors.raw_data}
                        errorMessage={errors.raw_data ? `Must be a valid JSON object like '{"key": "value"}'` : undefined}
                        variant="bordered"
                        minRows={2}
                    />
                </div>
            </div>

            {/* Section E: Coupon info */}
            <div className="border rounded-md p-4 space-y-4 md:col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Coupon Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2 sm:col-span-2">
                        <label className="text-sm font-medium">Coupon Expiration Date (Optional)</label>
                        <Controller
                            name="coupon_expiration_date"
                            control={control}
                            render={({ field }) => (
                                <DateInput
                                    value={field.value || undefined}
                                    onChange={(value: InternationalizedDateValue) => field.onChange(value)}
                                    variant="bordered"
                                    isInvalid={!!errors.coupon_expiration_date}
                                    errorMessage={errors.coupon_expiration_date?.message?.toString()}
                                    granularity="second"
                                    labelPlacement="outside-left"
                                />
                            )}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <Input
                            {...register("coupon_terms")}
                            label="Coupon Terms (optional)"
                            placeholder="e.g., Minimum spend $100"
                            isInvalid={!!errors.coupon_terms}
                            errorMessage={errors.coupon_terms?.message}
                            labelPlacement="outside-left"
                            variant="bordered"
                        />
                    </div>
                </div>
            </div>

            {/* Section F: Offers list */}
            <div id="offers-information" className="border rounded-md space-y-4 md:col-span-2 lg:col-span-4 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Offers (at least one required)</h3>
                    <Button
                        color="primary"
                        variant="ghost"
                        size="sm"
                        onPress={() => appendOffer({
                            condition: 'New',
                            price: 0.01,
                            currency: 'USD',
                            availability: 'In Stock',
                            merchant_name: '',
                            is_prime: false,
                            coupon_type: null,
                        })}
                    >
                        Add Offer
                    </Button>
                </div>

                {errors.offers && !Array.isArray(errors.offers) && (
                    <p className="text-tiny text-danger">{errors.offers.message}</p>
                )}

                {offerFields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md space-y-4 relative bg-content1/5 dark:bg-content1/10">
                        {offerFields.length > 1 && (
                            <Button
                                color="danger"
                                variant="light"
                                onPress={() => removeOffer(index)}
                                isIconOnly
                                size="sm"
                                className="absolute top-1 right-1 z-10"
                            >
                                <TrashIcon size={16} />
                            </Button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <Controller
                                name={`offers.${index}.condition`}
                                control={control}
                                rules={{ required: 'Condition is required' }}
                                render={({ field }) => (
                                    <Select
                                        label="Condition"
                                        placeholder="Select condition"
                                        isRequired
                                        isInvalid={!!errors.offers?.[index]?.condition}
                                        errorMessage={errors.offers?.[index]?.condition?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        selectedKeys={field.value ? [field.value] : []}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value)}
                                        onBlur={field.onBlur}
                                        value={field.value ?? ""}
                                    >
                                        <SelectItem key="New">New</SelectItem>
                                        <SelectItem key="Used - Like New">Used - Like New</SelectItem>
                                        <SelectItem key="Used - Very Good">Used - Very Good</SelectItem>
                                        <SelectItem key="Used - Good">Used - Good</SelectItem>
                                        <SelectItem key="Used - Acceptable">Used - Acceptable</SelectItem>
                                        <SelectItem key="Refurbished">Refurbished</SelectItem>
                                    </Select>
                                )}
                            />
                            <Controller
                                name={`offers.${index}.price`}
                                control={control}
                                rules={{ required: 'Price is required' }}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Price"
                                        placeholder="e.g., 99.99"
                                        isRequired
                                        isInvalid={!!errors.offers?.[index]?.price}
                                        errorMessage={errors.offers?.[index]?.price?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        step={0.01}
                                        minValue={0.01}
                                        formatOptions={{
                                            style: "decimal",
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }}
                                        value={field.value ?? undefined}
                                        onValueChange={(value: number | null | undefined) => field.onChange(value)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <Input
                                {...register(`offers.${index}.currency`)}
                                label="Currency"
                                placeholder="e.g., USD"
                                isRequired
                                isInvalid={!!errors.offers?.[index]?.currency}
                                errorMessage={errors.offers?.[index]?.currency?.message}
                                labelPlacement="outside-left"
                                variant="bordered"
                            />
                            <Controller
                                name={`offers.${index}.availability`}
                                control={control}
                                rules={{ required: 'Availability is required' }}
                                render={({ field }) => (
                                    <Select
                                        label="Availability"
                                        placeholder="Select availability"
                                        isRequired
                                        isInvalid={!!errors.offers?.[index]?.availability}
                                        errorMessage={errors.offers?.[index]?.availability?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        selectedKeys={field.value ? [field.value] : []}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value)}
                                        onBlur={field.onBlur}
                                        value={field.value ?? ""}
                                    >
                                        <SelectItem key="In Stock">In Stock</SelectItem>
                                        <SelectItem key="Out of Stock">Out of Stock</SelectItem>
                                        <SelectItem key="Limited Stock">Limited Stock</SelectItem>
                                        <SelectItem key="Pre-order">Pre-order</SelectItem>
                                        <SelectItem key="Backorder">Backorder</SelectItem>
                                        <SelectItem key="Discontinued">Discontinued</SelectItem>
                                        <SelectItem key="Available">Available</SelectItem>
                                        <SelectItem key="Temporarily Unavailable">Temporarily Unavailable</SelectItem>
                                    </Select>
                                )}
                            />
                            <Input
                                {...register(`offers.${index}.merchant_name`)}
                                label="Merchant Name"
                                placeholder="e.g., Amazon.com"
                                isRequired
                                isInvalid={!!errors.offers?.[index]?.merchant_name}
                                errorMessage={errors.offers?.[index]?.merchant_name?.message}
                                labelPlacement="outside-left"
                                variant="bordered"
                            />
                            <Controller
                                name={`offers.${index}.original_price`}
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Original Price (Optional)"
                                        placeholder="e.g., 129.99"
                                        isInvalid={!!errors.offers?.[index]?.original_price}
                                        errorMessage={errors.offers?.[index]?.original_price?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        step={0.01}
                                        minValue={0}
                                        value={field.value ?? undefined}
                                        onValueChange={(value) => field.onChange(value ?? undefined)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <Controller
                                name={`offers.${index}.savings`}
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Savings Amount (Optional)"
                                        placeholder="e.g., 30.00"
                                        isInvalid={!!errors.offers?.[index]?.savings}
                                        errorMessage={errors.offers?.[index]?.savings?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        step={0.01}
                                        minValue={0}
                                        value={field.value ?? undefined}
                                        onValueChange={(value) => field.onChange(value ?? undefined)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <Controller
                                name={`offers.${index}.savings_percentage`}
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Savings Percentage (Optional)"
                                        placeholder="e.g., 23"
                                        isInvalid={!!errors.offers?.[index]?.savings_percentage}
                                        errorMessage={errors.offers?.[index]?.savings_percentage?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        step={1}
                                        minValue={0}
                                        maxValue={100}
                                        value={field.value ?? undefined}
                                        onValueChange={(value) => field.onChange(value ?? undefined)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <Controller
                                name={`offers.${index}.coupon_type`}
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Coupon Type (Optional)"
                                        placeholder="Select coupon type"
                                        isInvalid={!!errors.offers?.[index]?.coupon_type}
                                        errorMessage={errors.offers?.[index]?.coupon_type?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        selectedKeys={field.value ? [field.value] : []}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(e.target.value || null)}
                                        value={field.value ?? ""}
                                        onBlur={field.onBlur}
                                    >
                                        <SelectItem key="">None</SelectItem>
                                        <SelectItem key="percentage">Percentage</SelectItem>
                                        <SelectItem key="fixed">Fixed Amount</SelectItem>
                                    </Select>
                                )}
                            />
                            <Controller
                                name={`offers.${index}.coupon_value`}
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Coupon Value (Optional)"
                                        placeholder="Value based on type"
                                        isInvalid={!!errors.offers?.[index]?.coupon_value}
                                        errorMessage={errors.offers?.[index]?.coupon_value?.message}
                                        labelPlacement="outside-left"
                                        variant="bordered"
                                        step={0.01}
                                        minValue={0}
                                        value={field.value ?? undefined}
                                        onValueChange={(value) => field.onChange(value ?? undefined)}
                                        onBlur={field.onBlur}
                                        classNames={{ input: 'min-w-[80px]' }}
                                    />
                                )}
                            />
                            <Controller
                                name={`offers.${index}.is_prime`}
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center pt-6">
                                        <Switch
                                            isSelected={field.value}
                                            onValueChange={field.onChange}
                                            color="primary"
                                        >
                                            Is Prime? (Optional)
                                        </Switch>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit button area */}
            <div className="md:col-span-2 lg:col-span-6 pt-4 flex justify-center sm:justify-end gap-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="bordered"
                        onPress={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    color="primary"
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    {isLoading ?
                        (mode === 'add' ? 'Adding...' : 'Updating...') :
                        (mode === 'add' ? 'Add Product' : 'Update Product')
                    }
                </Button>
            </div>
        </Form>
    );
};

export default ProductForm; 