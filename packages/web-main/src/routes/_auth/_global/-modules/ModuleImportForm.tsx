import { FC, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FileField, styled, Button, TextField, Drawer, CollapseList, FormError } from '@takaro/lib-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export interface IFormInputs {
  name: string;
  importData: FileList;
}

interface ModuleFormProps {
  isLoading?: boolean;
  onSubmit: (data: IFormInputs) => void;
  error: string | string[] | null;
}

const MAX_FILE_SIZE = 5_000_000; // 5MB
const ACCEPTED_FILE_TYPES = ['application/json'];

export const ModuleImportForm: FC<ModuleFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const { handleSubmit, control, formState } = useForm<IFormInputs>({
    mode: 'onChange',
    defaultValues: {},
    resolver: zodResolver(
      z.object({
        importData: z
          .any()
          .refine((files) => files?.length == 1, 'Import data is required')
          .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
          .refine((files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), 'Only .json files are accepted.'),
        name: z.string(),
      }),
    ),
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      navigate({ to: '/modules' });
    }
  };

  const submitHandler: SubmitHandler<IFormInputs> = ({ importData, name }) => {
    onSubmit({ importData: importData, name });
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} promptCloseConfirmation={formState.isDirty}>
      <Drawer.Content>
        <Drawer.Heading>{'Import module'}</Drawer.Heading>
        <Drawer.Body>
          <form id="module-definition" onSubmit={handleSubmit(submitHandler)}>
            <CollapseList>
              <CollapseList.Item title="General">
                <TextField
                  control={control}
                  label="Name"
                  loading={isLoading}
                  name="name"
                  placeholder="My cool module"
                  required
                />
                <FileField
                  control={control}
                  label="module json file"
                  description="Upload your module.json file here"
                  placeholder="your_module.json"
                  loading={isLoading}
                  name="importData"
                  required
                />
              </CollapseList.Item>
            </CollapseList>
            {error && <FormError error={error} />}
          </form>
        </Drawer.Body>
        <Drawer.Footer>
          <ButtonContainer>
            <Button onClick={() => setOpen(false)} color="background">
              Cancel
            </Button>
            <Button type="submit" form="module-definition" fullWidth>
              Import module
            </Button>
          </ButtonContainer>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};
