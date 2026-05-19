"use client";

import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Textarea, Switch } from '@heroui/react';
import { Code, Plus, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useCustomScripts } from '@/lib/hooks';
import { ScriptLocation } from '@/lib/models/CustomScript';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

// Define custom script interface
interface CustomScript {
    _id?: string;
    name: string;
    content: string;
    location: ScriptLocation;
    enabled: boolean;
    isNew?: boolean;
}

// Script location options
const locationOptions = [
    { value: ScriptLocation.HEAD, label: 'Head' },
    { value: ScriptLocation.BODY_START, label: 'Body Start' },
    { value: ScriptLocation.BODY_END, label: 'Body End' },
];

export function CustomScriptsManager() {
    const { data: scriptsData, isLoading, mutate } = useCustomScripts();
    const [isSaving, setIsSaving] = useState(false);
    const [scripts, setScripts] = useState<CustomScript[]>([]);

    // Update form when data is received
    useEffect(() => {
        if (scriptsData?.items) {
            setScripts(scriptsData.items);
        }
    }, [scriptsData]);

    // Add new script
    const handleAddScript = () => {
        setScripts([
            ...scripts,
            {
                name: '',
                content: '',
                location: ScriptLocation.HEAD,
                enabled: true,
                isNew: true
            }
        ]);
    };

    // Delete script
    const handleRemoveScript = async (index: number) => {
        const scriptToRemove = scripts[index];

        // If script exists in database, send DELETE request
        if (scriptToRemove._id) {
            try {
                const response = await fetch(`/api/settings/custom-scripts?id=${scriptToRemove._id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete script');
                }

                showSuccessToast({
                    title: 'Script Deleted',
                    description: 'Successfully deleted script',
                });
            } catch (error) {
                showErrorToast({
                    title: 'Delete Failed',
                    description: error instanceof Error ? error.message : 'Please try again later',
                });

                return; // Don't update local state if delete failed
            }
        }

        // Update local state
        setScripts(scripts.filter((_, i) => i !== index));
    };

    // Handle script field changes
    const handleScriptChange = (index: number, field: string, value: string | boolean | ScriptLocation) => {
        const updatedScripts = [...scripts];

        updatedScripts[index] = {
            ...updatedScripts[index],
            [field]: value
        };
        setScripts(updatedScripts);
    };

    // Save all scripts
    const handleSaveScripts = async () => {
        // Validate all scripts
        const invalidScripts = scripts.filter(script =>
            !script.name.trim() || !script.content.trim()
        );

        if (invalidScripts.length > 0) {
            showErrorToast({
                title: 'Validation Failed',
                description: 'Please ensure all scripts have a name and content',
            });

            return;
        }

        try {
            setIsSaving(true);

            const response = await fetch('/api/settings/custom-scripts', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scripts),
            });

            if (!response.ok) {
                throw new Error('Save failed');
            }

            await mutate();
            showSuccessToast({
                title: 'Saved Successfully',
                description: 'All scripts have been saved',
            });
        } catch (error) {
            showErrorToast({
                title: 'Save Failed',
                description: error instanceof Error ? error.message : 'Please try again later',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
                <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Custom Scripts</h2>
                <Button
                    color="primary"
                    onClick={handleAddScript}
                    startContent={<Plus size={16} />}
                >
                    Add Script
                </Button>
            </div>

            {scripts.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-8 text-gray-500">
                        <Code size={40} className="mx-auto mb-3" />
                        <p>No custom scripts. Click the &quot;Add Script&quot; button to create your first script.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {scripts.map((script, index) => (
                        <Card key={script._id || `new-script-${index}`} className="overflow-hidden">
                            <CardHeader className="flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Code size={16} className="text-gray-600" />
                                    <span>Script #{index + 1}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Enabled</span>
                                        <Switch
                                            isSelected={script.enabled}
                                            onValueChange={(value) => handleScriptChange(index, 'enabled', value)}
                                        />
                                    </div>
                                    <Button
                                        isIconOnly
                                        color="danger"
                                        variant="light"
                                        onClick={() => handleRemoveScript(index)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4 space-y-4">
                                <div>
                                    <Input
                                        label="Script Name"
                                        labelPlacement="outside-left"
                                        value={script.name || ''}
                                        onChange={(e) => handleScriptChange(index, 'name', e.target.value)}
                                        placeholder="E.g.: Google Analytics, Facebook Pixel"
                                        isRequired
                                    />
                                </div>

                                <div>
                                    <Select
                                        label="Script Location"
                                        selectedKeys={[script.location]}
                                        onChange={(e) => handleScriptChange(index, 'location', e.target.value)}
                                        labelPlacement="outside-left"
                                    >
                                        {locationOptions.map((option) => (
                                            <SelectItem key={option.value} >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Textarea
                                        label="Script Content"
                                        value={script.content || ''}
                                        onChange={(e) => handleScriptChange(index, 'content', e.target.value)}
                                        placeholder="<script>...</script> or other HTML code"
                                        minRows={5}
                                        isRequired
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    <div className="flex justify-end mt-6">
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={handleSaveScripts}
                            isDisabled={isSaving}
                            startContent={<Save size={16} />}
                        >
                            {isSaving ? 'Saving...' : 'Save All Scripts'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 