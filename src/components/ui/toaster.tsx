import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

type ToasterToast = React.ComponentPropsWithoutRef<typeof Toast> & {
	id: string;
	title?: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactNode;
	dismiss: () => void;
};

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
                        {toasts.map(({ id, title, description, action, dismiss, ...props }: ToasterToast) => {
				return (
					<Toast key={id} {...props}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}