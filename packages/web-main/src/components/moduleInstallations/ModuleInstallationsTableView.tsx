import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { Table, useTableActions, styled, IconButton, Chip, Button, Tooltip } from '@takaro/lib-components';
import { ModuleOutputDTO, ModuleInstallationOutputDTO } from '@takaro/apiclient';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useHasPermission } from '../../hooks/useHasPermission';
import { ModuleUninstallDialog } from '../../components/dialogs/ModuleUninstallDialog';
import { useSnackbar } from 'notistack';
import { moduleInstallationsOptions, useGameServerModuleInstall } from '../../queries/gameserver';
import { modulesQueryOptions } from '../../queries/module';
import { UncontrolledModuleVersionSelectQueryField } from '../../components/selects';
import { getNewestVersionExcludingLatestTag } from '../../util/ModuleVersionHelpers';
import { ModuleInstallationActions } from './ModuleInstallationActions';

const InstallContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
  justify-content: flex-end;
  padding-right: ${({ theme }) => theme.spacing[1]};
`;

type ModuleInstallationsTableViewProps = Record<string, never>;

interface CombinedModule extends ModuleOutputDTO {
  installation?: ModuleInstallationOutputDTO;
}

export const ModuleInstallationsTableView: FC<ModuleInstallationsTableViewProps> = () => {
  const navigate = useNavigate();
  const { gameServerId } = useParams({ from: '/_auth/gameserver/$gameServerId/modules' });
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: installModule } = useGameServerModuleInstall();
  const [quickSearchInput, setQuickSearchInput] = useState<string>('');
  const [openUninstallDialog, setOpenUninstallDialog] = useState<{ installation: ModuleInstallationOutputDTO } | null>(
    null,
  );
  const [selectedVersions, setSelectedVersions] = useState<{ [moduleId: string]: string }>({});
  const canManageGameServers = useHasPermission(['MANAGE_GAMESERVERS']);

  // Query for all modules
  const { data: modulesData, isPending: modulesPending } = useQuery(modulesQueryOptions());
  const modules = modulesData?.data || [];

  // Query for module installations
  const { data: installationsData, isPending: installationsPending } = useQuery(
    moduleInstallationsOptions({ filters: { gameserverId: [gameServerId] } }),
  );
  const installations = installationsData || [];

  // Combine modules with their installations
  const combinedModules: CombinedModule[] = modules.map((module) => {
    const installation = installations.find((inst) => inst.module.id === module.id);
    return { ...module, installation };
  });

  // No longer need to separate modules - use combinedModules directly

  // Set default versions for uninstalled modules
  useEffect(() => {
    const defaultVersions: { [moduleId: string]: string } = {};

    combinedModules.forEach((module) => {
      // Only set default for uninstalled modules that don't already have a selection
      if (!module.installation && !selectedVersions[module.id] && module.versions && module.versions.length > 0) {
        // Try to get the newest semver version (excluding 'latest')
        const semverVersions = module.versions.filter((v) => v.tag !== 'latest');

        if (semverVersions.length > 0) {
          // Use the helper to get the newest semver version
          const newestVersion = getNewestVersionExcludingLatestTag(module.versions);
          defaultVersions[module.id] = newestVersion.tag;
        } else {
          // If no semver versions exist, default to 'latest'
          defaultVersions[module.id] = 'latest';
        }
      }
    });

    // Only update state if there are new defaults to set
    if (Object.keys(defaultVersions).length > 0) {
      setSelectedVersions((prev) => ({ ...prev, ...defaultVersions }));
    }
  }, [modules, installations]); // Don't include selectedVersions to avoid infinite loop

  const handleInstall = (moduleId: string) => {
    const versionTag = selectedVersions[moduleId];
    if (!versionTag) return;

    navigate({
      to: '/gameserver/$gameServerId/modules/$moduleId/$moduleVersionTag/install',
      params: { gameServerId, moduleId, moduleVersionTag: versionTag },
    });
  };

  const handleToggleEnabled = (installation: ModuleInstallationOutputDTO) => {
    const systemConfig = { ...installation.systemConfig } as any;
    systemConfig.enabled = !(systemConfig.enabled || false);

    installModule(
      {
        gameServerId,
        versionId: installation.versionId,
        systemConfig: JSON.stringify(systemConfig),
        userConfig: JSON.stringify(installation.userConfig),
      },
      {
        onError: (_) => enqueueSnackbar('Failed to enable/disable module', { variant: 'default', type: 'error' }),
      },
    );
  };

  const columnHelper = createColumnHelper<CombinedModule>();

  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      id: 'id',
      cell: (info) => info.getValue(),
      enableColumnFilter: false,
      enableHiding: true,
      meta: { hideColumn: true },
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      id: 'name',
      cell: (info) => {
        const module = info.row.original;
        return (
          <Link to="/modules/$moduleId/view" params={{ moduleId: module.id }}>
            {info.getValue()}
          </Link>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
    }),
    columnHelper.display({
      header: 'Installed',
      id: 'installed',
      cell: ({ row }) => {
        const module = row.original;
        return module.installation ? (
          <Chip color="primary" label="Installed" />
        ) : (
          <Chip color="backgroundAccent" label="Not Installed" />
        );
      },
      enableColumnFilter: true,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Author',
      id: 'author',
      cell: ({ row }) => {
        const author = row.original.author || 'Unknown';
        return author === 'Takaro' ? (
          <Tooltip>
            <Tooltip.Trigger>
              <Chip color="primary" label="Official" />
            </Tooltip.Trigger>
            <Tooltip.Content>This module is developed and maintained by the Takaro team.</Tooltip.Content>
          </Tooltip>
        ) : (
          <span>{author}</span>
        );
      },
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Version',
      id: 'version',
      cell: ({ row }) => {
        const module = row.original;
        return module.installation?.version?.tag || 'N/A';
      },
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Enabled',
      id: 'status',
      cell: ({ row }) => {
        const module = row.original;
        if (!module.installation) return null;
        return (
          <Tooltip>
            <Tooltip.Trigger>
              <IconButton
                icon={(module.installation.systemConfig as any)?.enabled ? <AiOutlineCheck /> : <AiOutlineClose />}
                onClick={() => handleToggleEnabled(module.installation!)}
                disabled={!canManageGameServers}
                ariaLabel="Toggle module enable/disable status"
              />
            </Tooltip.Trigger>
            <Tooltip.Content>
              {(module.installation.systemConfig as any)?.enabled ? 'Disable module' : 'Enable module'}
            </Tooltip.Content>
          </Tooltip>
        );
      },
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Commands',
      id: 'commands',
      cell: ({ row }) => row.original.latestVersion?.commands?.length || 0,
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Hooks',
      id: 'hooks',
      cell: ({ row }) => row.original.latestVersion?.hooks?.length || 0,
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Cronjobs',
      id: 'cronjobs',
      cell: ({ row }) => row.original.latestVersion?.cronJobs?.length || 0,
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Permissions',
      id: 'permissions',
      cell: ({ row }) =>
        row.original.latestVersion?.permissions?.filter((p: any) => !p.permission.startsWith('SYSTEM_')).length || 0,
      enableColumnFilter: false,
      enableSorting: false,
    }),
    columnHelper.display({
      header: 'Actions',
      id: 'actions',
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
      cell: ({ row }) => {
        const m = row.original;
        return (
          <>
            {m.installation ? (
              <ModuleInstallationActions gameServerId={gameServerId} mod={m} installation={m.installation} />
            ) : (
              <InstallContainer>
                <UncontrolledModuleVersionSelectQueryField
                  value={selectedVersions[m.id] || ''}
                  onChange={(value) => setSelectedVersions((prev) => ({ ...prev, [m.id]: value as string }))}
                  moduleId={m.id}
                  name={`version-select-${m.id}`}
                />
                <Button onClick={() => handleInstall(m.id)} disabled={!selectedVersions[m.id] || !canManageGameServers}>
                  Install
                </Button>
              </InstallContainer>
            )}
          </>
        );
      },
    }),
  ];

  const tableActions = useTableActions<CombinedModule>({ pageSize: 25 });

  if (modulesPending || installationsPending) {
    return <div>Loading...</div>;
  }

  // Filter modules based on search input
  const filteredModules = quickSearchInput
    ? combinedModules.filter((module) => module.name.toLowerCase().includes(quickSearchInput.toLowerCase()))
    : combinedModules;

  return (
    <>
      <Table
        id="modules"
        data={filteredModules}
        columns={columns}
        searchInputPlaceholder="Search modules by name..."
        onSearchInputChanged={setQuickSearchInput}
        pagination={{
          paginationState: tableActions.pagination.paginationState,
          setPaginationState: tableActions.pagination.setPaginationState,
          pageOptions: tableActions.pagination.getPageOptions({
            data: filteredModules,
            meta: { total: filteredModules.length, serverTime: Date.now().toString(), error: null as any },
          }),
        }}
        columnFiltering={tableActions.columnFilters}
        columnSearch={tableActions.columnSearch}
        sorting={tableActions.sorting}
      />

      {openUninstallDialog && (
        <ModuleUninstallDialog
          moduleName={openUninstallDialog.installation.module.name}
          gameServerId={gameServerId}
          versionId={openUninstallDialog.installation.versionId}
          moduleId={openUninstallDialog.installation.moduleId}
          open={true}
          onOpenChange={(open) => !open && setOpenUninstallDialog(null)}
        />
      )}
    </>
  );
};
