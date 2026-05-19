'use client';

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    ScrollShadow,
    Tab,
    Tabs
} from '@heroui/react';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

import type { ComponentProduct } from '@/types';

import { METADATA_FIELDS } from './ProductMetadataBlot';

interface ProductMetadataSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    product: ComponentProduct | null;
    onSelect: (fieldId: string) => void;
}

export function ProductMetadataSelector({
    isOpen,
    onClose,
    product,
    onSelect
}: ProductMetadataSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('basic');

    // Filter fields
    const filteredFields = useMemo(() => {
        const query = searchQuery.toLowerCase();

        if (!query) return METADATA_FIELDS;

        const result = Object.entries(METADATA_FIELDS).reduce((acc, [category, fields]) => {
            const matchedFields = fields.filter(field =>
                field.name.toLowerCase().includes(query) ||
                field.id.toLowerCase().includes(query)
            );

            if (matchedFields.length > 0) {
                return {
                    ...acc,
                    [category]: matchedFields
                };
            }

            return acc;
        }, {} as Partial<typeof METADATA_FIELDS>) as typeof METADATA_FIELDS;

        return result;
    }, [searchQuery]);

    // Handle field selection
    const handleFieldSelect = (fieldId: string) => {
        onSelect(fieldId);
        onClose();
    };

    // Modify rendering to use type-safe field access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderFieldValue = (field: { id: string; render: (value: any) => string }, value: any) => {
        try {
            return field.render(value);
        } catch {
            return 'Format Error';
        }
    };

    // If no products, show toast message
    if (!product) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="lg"
                disableAnimation={false}
                classNames={{
                    backdrop: "z-[9998]",
                    base: "z-[9999]",
                    wrapper: "z-[9999]"
                }}
            >
                <ModalContent>
                    <ModalHeader>
                        <h3 className="text-lg font-medium">Select Product Metadata</h3>
                    </ModalHeader>
                    <ModalBody>
                        <div className="py-10 text-center">
                            <p className="text-gray-500">Please select a product first</p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            disableAnimation={false}
            classNames={{
                backdrop: "z-[9998]",
                base: "z-[9999]",
                wrapper: "z-[9999]"
            }}
        >
            <ModalContent>
                <ModalHeader>
                    <h3 className="text-lg font-medium">Select Product Metadata</h3>
                </ModalHeader>

                <ModalBody>
                    {/* Search box */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Tabs */}
                    <Tabs selectedKey={selectedTab} onSelectionChange={key => setSelectedTab(key as string)}>
                        <Tab key="basic" title="Basic Info">
                            <ScrollShadow className="h-[300px]">
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredFields.basic?.map(field => (
                                        <button
                                            key={field.id}
                                            onClick={() => handleFieldSelect(field.id)}
                                            className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-sm">{field.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {renderFieldValue(field, product?.[field.id as keyof ComponentProduct])}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollShadow>
                        </Tab>
                        <Tab key="price" title="Price Info">
                            <ScrollShadow className="h-[300px]">
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredFields.price?.map(field => (
                                        <button
                                            key={field.id}
                                            onClick={() => handleFieldSelect(field.id)}
                                            className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-sm">{field.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {renderFieldValue(field, Number(product?.[field.id as keyof ComponentProduct] || 0))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollShadow>
                        </Tab>
                        <Tab key="shipping" title="Shipping Info">
                            <ScrollShadow className="h-[300px]">
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredFields.shipping?.map(field => (
                                        <button
                                            key={field.id}
                                            onClick={() => handleFieldSelect(field.id)}
                                            className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-sm">{field.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {renderFieldValue(field, Boolean(product?.[field.id as keyof ComponentProduct] || false))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollShadow>
                        </Tab>
                        <Tab key="coupon" title="Coupon Info">
                            <ScrollShadow className="h-[300px]">
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredFields.coupon?.map(field => (
                                        <button
                                            key={field.id}
                                            onClick={() => handleFieldSelect(field.id)}
                                            className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-sm">{field.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {renderFieldValue(field, product?.[field.id as keyof ComponentProduct] || null)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollShadow>
                        </Tab>
                    </Tabs>
                </ModalBody>

                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 