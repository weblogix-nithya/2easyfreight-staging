import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    useDisclosure,
} from "@chakra-ui/react";
import React from "react";

type Props = {
    onConfirm: () => void;
};

export default function PreAllocateConfirm({ onConfirm }: Props) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef(null);

    const handleYes = () => {
        onConfirm(); // actual submit function
        onClose();
    };

    return (
        <>
            <Button colorScheme="blue" onClick={onOpen}>
                Pre-Allocate Jobs
            </Button>

            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            Confirm Action
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to pre-allocate?
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                No
                            </Button>

                            <Button colorScheme="red" ml={3} onClick={handleYes}>
                                Yes
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}