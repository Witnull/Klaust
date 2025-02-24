import { ToastContentProps,  toast} from "react-toastify";
  
// Preset toast functions with default settings
export const showToast = {
    info: (message: string) =>
        toast(message, {
            position: "bottom-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark"}
        ),
    success: (message: string) =>
        toast.success(message, {
            position: "bottom-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark"
        }),
    error: (message: string ) =>
        toast.error(message, {
            position: "bottom-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark"
        }),
    warn: (message: string) =>
        toast.warning(message, {
            position: "bottom-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
        }),
    congrats: (title: string, message: string) =>
        toast( CustomNotification, {
            data: {
                title: title,
                content: message,
            },
            className: "congrats",
            position: "bottom-right",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            
        }),
};

type CustomNotificationProps = ToastContentProps<{
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