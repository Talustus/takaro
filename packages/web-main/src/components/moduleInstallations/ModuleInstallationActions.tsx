import { Dropdown, IconButton, Popover, useTheme } from '@takaro/lib-components';
import { FC, MouseEvent, useRef, useState } from 'react';
import { ModuleInstallationOutputDTO, ModuleOutputDTO, PERMISSIONS } from '@takaro/apiclient';
import { PermissionsGuard } from '../../components/PermissionsGuard';
import { useNavigate } from '@tanstack/react-router';
import { useGameServerModuleInstall } from '../../queries/gameserver';
import { DeleteImperativeHandle } from '../../components/dialogs';
import { ModuleUninstallDialog } from '../../components/dialogs/ModuleUninstallDialog';

import {
  AiOutlineDelete as DeleteIcon,
  AiOutlineSetting as ConfigIcon,
  AiOutlineMenu as MenuIcon,
  AiOutlineLink as LinkIcon,
  AiOutlineEye as ViewIcon,
  AiOutlineStop as DisableIcon,
  AiOutlineCheck as EnableIcon,
  AiOutlineBook as DocumentationIcon,
  AiOutlineRetweet as DifferentVersionIcon,
} from 'react-icons/ai';

import { AiOutlineCopy as CopyIcon } from 'react-icons/ai';
import { ModuleVersionInstallForm } from './ModuleVersionInstallForm';

interface ModuleInstallationActionProps {
  mod: ModuleOutputDTO;
  installation?: ModuleInstallationOutputDTO;
  gameServerId: string;
}

export const ModuleInstallationActions: FC<ModuleInstallationActionProps> = ({ mod, installation, gameServerId }) => {
  const { mutate: installModule } = useGameServerModuleInstall();
  const [showInstallOtherVersionPopover, setShowInstallOtherVersionPopover] = useState<boolean>(false);

  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const uninstallModuleDialogRef = useRef<DeleteImperativeHandle>(null);

  const navigate = useNavigate();
  const handleOnOpenInModuleBuilderClick = () => {
    window.open(`/module-builder/${mod.id}`, '_blank');
  };
  const handleOnOpenInDocumentationClick = () => {
    window.open('https://docs.takaro.io/advanced/modules', '_blank');
  };

  const handleOnViewModuleConfigClick = (e: MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: '/gameserver/$gameServerId/modules/$moduleId/$moduleVersionTag/install/view',
      params: { gameServerId, moduleId: mod.id, moduleVersionTag: installation!.version.tag },
    });
  };

  const handleOnUninstallClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      uninstallModuleDialogRef.current?.triggerDelete();
    } else {
      setOpenDialog(true);
    }
  };

  const handleConfigureClick = (e: MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: '/gameserver/$gameServerId/modules/$moduleId/$moduleVersionTag/update',
      params: { gameServerId, moduleId: mod.id, moduleVersionTag: installation!.version.tag },
    });
  };

  const handleOnCopyClick = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mod.id);
  };

  const handleOnModuleEnableDisableClick = (e: MouseEvent) => {
    e.stopPropagation();

    const systemConfig = installation!.systemConfig;
    systemConfig['enabled'] = !systemConfig['enabled'];
    installModule({
      versionId: installation!.versionId,
      gameServerId,
      systemConfig: JSON.stringify(systemConfig),
      userConfig: JSON.stringify(installation!.userConfig),
    });
  };

  const isModuleInstallationEnabled = installation?.systemConfig['enabled'] === true ? true : false;

  return (
    <>
      {installation && (
        <ModuleUninstallDialog
          ref={uninstallModuleDialogRef}
          open={openDialog}
          onOpenChange={setOpenDialog}
          gameServerId={gameServerId}
          versionId={installation.version.id}
          moduleId={mod.id}
          moduleName={mod.name}
        />
      )}
      <Dropdown>
        <Dropdown.Trigger>
          <IconButton icon={<MenuIcon />} ariaLabel="Settings" />
        </Dropdown.Trigger>
        <Dropdown.Menu>
          <Dropdown.Menu.Group label="Actions">
            <PermissionsGuard requiredPermissions={[[PERMISSIONS.ManageModules]]}>
              <Dropdown.Menu.Item
                icon={<ViewIcon />}
                onClick={handleOnViewModuleConfigClick}
                label="View module config"
              />
              <Dropdown.Menu.Item
                icon={<ConfigIcon />}
                onClick={handleConfigureClick}
                label="Change module configuration"
              />
              <Dropdown.Menu.Item
                icon={<DifferentVersionIcon />}
                label="Install different module version"
                onClick={() => setShowInstallOtherVersionPopover(true)}
              />
              <Dropdown.Menu.Item icon={<CopyIcon />} onClick={handleOnCopyClick} label="Copy module id" />
              <Dropdown.Menu.Item
                icon={
                  isModuleInstallationEnabled ? (
                    <DisableIcon fill={theme.colors.error} />
                  ) : (
                    <EnableIcon fill={theme.colors.success} />
                  )
                }
                onClick={handleOnModuleEnableDisableClick}
                label={isModuleInstallationEnabled ? 'Disable module' : 'Enable module'}
              />

              <Dropdown.Menu.Item
                icon={<DeleteIcon fill={theme.colors.error} />}
                onClick={handleOnUninstallClick}
                label="Uninstall module"
              />
            </PermissionsGuard>
          </Dropdown.Menu.Group>
          <Dropdown.Menu.Group>
            <Dropdown.Menu.Item
              icon={<LinkIcon />}
              onClick={handleOnOpenInModuleBuilderClick}
              label="Open in Module Builder"
            />
            <Dropdown.Menu.Item
              icon={<DocumentationIcon />}
              label="View module documentation"
              onClick={handleOnOpenInDocumentationClick}
            />
          </Dropdown.Menu.Group>
        </Dropdown.Menu>
      </Dropdown>
      {installation && (
        <Popover
          open={showInstallOtherVersionPopover}
          onOpenChange={setShowInstallOtherVersionPopover}
          placement="bottom"
        >
          <Popover.Trigger>
            <div></div>
          </Popover.Trigger>
          <Popover.Content>
            <div style={{ display: 'flex', padding: '20px', flexDirection: 'column', minWidth: '300px' }}>
              <h2 style={{ marginBottom: '10px' }}>Install different module version</h2>
              <ModuleVersionInstallForm
                moduleId={mod.id}
                gameServerId={gameServerId}
                filterVersions={(version) => version.tag !== installation.version.tag}
              />
            </div>
          </Popover.Content>
        </Popover>
      )}
    </>
  );
};
