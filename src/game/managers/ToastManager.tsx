import { ToastContentProps,  toast} from "react-toastify";
  
// Preset toast functions with default settings
export const showToast = {
    info: (message: string, timeout?: number, id?: string) =>
        toast(message, {
            position: "bottom-right",
            autoClose: timeout || 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            toastId: id || undefined
        }),
    success: (message: string, timeout?: number, id?: string) =>
        toast.success(message, {
            position: "bottom-right",
            autoClose: timeout || 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            toastId: id || undefined
        }),
    error: (message: string, timeout?: number, id?: string) =>
        toast.error(message, {
            position: "bottom-right",
            autoClose: timeout || 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            toastId: id || undefined
        }),
    warn: (message: string, timeout?: number, id?: string) =>
        toast.warning(message, {
            position: "bottom-right",
            autoClose: timeout || 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            toastId: id || undefined,
        }),
    congrats: (title: string, message: string, timeout?: number, id?: string) =>
        toast(CustomNotification, {
            data: {
                id: id || undefined,
                title: title,
                content: message,
            },
            className: "congrats",
            position: "bottom-right",
            autoClose: timeout || 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            
        }),
};

type CustomNotificationProps = ToastContentProps<{
    id?: string;
    title: string;
    content: string;
  }>;

function CustomNotification({data}: CustomNotificationProps) {
return (
    <div className="flex flex-col w-full">
    <h3 className="text-lg font-bold">
        {data.title}
    </h3>
    <div>
        {data.content}
    </div>
    </div>
);
}