import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { errorMessage } from '@/api/client';
import { useConfirm } from '@/context/DialogContext';
import { useSettings } from '@/context/SettingsContext';
import { useSnackbar } from '@/context/SnackbarContext';

interface Options<T> {
  queryKey: QueryKey;
  getList?: (data: unknown) => T[];
  setList?: (data: unknown, list: T[]) => unknown;
  remove: (id: string) => Promise<unknown>;
  confirmTitle: string;
  confirmContent: string;
  deletedMessage: (item: T) => string;
  invalidate?: QueryKey[];
}

export function useUndoableDelete<T extends { id: string }>(options: Options<T>) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const { confirmDeletion } = useSettings();
  const getList = options.getList ?? ((data: unknown) => (data as T[]) ?? []);
  const setList = options.setList ?? ((_: unknown, list: T[]) => list);

  return async (item: T) => {
    if (confirmDeletion) {
      const ok = await confirm({ title: options.confirmTitle, content: options.confirmContent });
      if (!ok) return;
    }

    const previous = queryClient.getQueryData(options.queryKey);
    if (previous !== undefined) {
      queryClient.setQueryData(
        options.queryKey,
        setList(
          previous,
          getList(previous).filter((i) => i.id !== item.id),
        ),
      );
    }

    let undone = false;
    snackbar.show(options.deletedMessage(item), {
      type: 'error',
      action: {
        label: 'Desfazer',
        onClick: () => {
          undone = true;
          if (previous !== undefined) queryClient.setQueryData(options.queryKey, previous);
        },
      },
      onDismiss: async () => {
        if (undone) return;
        try {
          await options.remove(item.id);
        } catch (error) {
          snackbar.show(errorMessage(error), { type: 'error' });
        } finally {
          queryClient.invalidateQueries({ queryKey: options.queryKey });
          options.invalidate?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
        }
      },
    });
  };
}
