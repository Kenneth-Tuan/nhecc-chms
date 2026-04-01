import AppMessageDialog from "~/components/AppMessageDialog.vue";

export const useAppDialog = () => {
  const dialog = useDialog();

  const showSuccess = (params: {
    title: string;
    message: string;
    buttonLabel?: string;
  }) => {
    dialog.open(AppMessageDialog, {
      props: {
        header: params.title,
        modal: true,
        style: {
          width: "90vw",
          maxWidth: "450px",
        },
        closable: false,
      },
      data: {
        type: "success",
        title: params.title,
        message: params.message,
        buttonLabel: params.buttonLabel || "太棒了，我知道了",
      },
    });
  };

  const showError = (params: {
    title: string;
    message: string;
    buttonLabel?: string;
  }) => {
    dialog.open(AppMessageDialog, {
      props: {
        header: params.title,
        modal: true,
        style: {
          width: "90vw",
          maxWidth: "450px",
        },
      },
      data: {
        type: "error",
        title: params.title,
        message: params.message,
        buttonLabel: params.buttonLabel || "確認並返回",
      },
    });
  };

  return {
    showSuccess,
    showError,
  };
};
