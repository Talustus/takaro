import { Button, Dialog, FormError, styled } from '@takaro/lib-components';
import { FC } from 'react';
import { RequiredDialogOptions } from '.';
import { usePlayerRoleRemove } from '../../queries/player';

const StyledDialogBody = styled(Dialog.Body)`
  h2 {
    margin-bottom: ${({ theme }) => theme.spacing['0_5']};
  }
`;

interface PlayerRoleDeleteDialogProps extends RequiredDialogOptions {
  roleName: string;
  roleId: string;
  gameServerId?: string;
  playerId: string;
  playerName: string;
}

export const PlayerRoleDeleteDialog: FC<PlayerRoleDeleteDialogProps> = ({
  roleName,
  playerName,
  roleId,
  gameServerId,
  playerId,
  ...dialogOptions
}) => {
  const { mutate, isPending, error } = usePlayerRoleRemove();

  const handleOnDelete = () => {
    mutate({ playerId, roleId, gameServerId }, { onSuccess: () => dialogOptions.onOpenChange(false) });
  };

  return (
    <Dialog {...dialogOptions}>
      <Dialog.Content>
        <Dialog.Heading>
          Role: <span style={{ textTransform: 'capitalize' }}>{roleName}</span>{' '}
        </Dialog.Heading>
        <StyledDialogBody size="medium">
          <h2>Remove Role</h2>
          <p>
            Are you sure you want to remove <strong>{roleName} </strong> from <strong>{playerName}</strong>?
          </p>
          <Button isLoading={isPending} onClick={handleOnDelete} fullWidth color="error">
            Remove role
          </Button>
          {error && <FormError error={error} />}
        </StyledDialogBody>
      </Dialog.Content>
    </Dialog>
  );
};
