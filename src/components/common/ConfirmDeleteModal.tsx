import React from "react"
import { Dialog } from "@headlessui/react"
import { Button } from "../ui/Button"

interface ConfirmDeleteModalProps {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
    itemName?: string
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
                                                                          open,
                                                                          onConfirm,
                                                                          onCancel,
                                                                          itemName = "this item",
                                                                      }) => {
    return (
        <Dialog open={open} onClose={onCancel} className="fixed z-50 inset-0 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <Dialog.Panel className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm z-10">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Confirm Deletion
                </Dialog.Title>
                <div className="mt-2 text-gray-700">
                    Are you sure you want to delete <strong>{itemName}</strong>?
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>Delete</Button>
                </div>
            </Dialog.Panel>
        </Dialog>
    )
}
