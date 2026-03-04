import { useState } from "#imports";

export const useGlobalLoading = () => {
  const isLoading = useState<boolean>("globalLoading", () => false);

  const showLoading = () => {
    isLoading.value = true;
  };

  const hideLoading = () => {
    isLoading.value = false;
  };

  return {
    isLoading,
    showLoading,
    hideLoading,
  };
};
