import { ModuleInstallationOutputDTO, ModuleOutputDTO } from '@takaro/apiclient';
import { Card, useTheme, Chip, Tooltip, styled } from '@takaro/lib-components';
import { FC, useState, useRef } from 'react';
import { SpacedRow, InnerBody } from '../style';
import { ModuleVersionInstallForm } from '../../../components/moduleInstallations/ModuleVersionInstallForm';
import { ModuleInstallationActions } from '../../../components/moduleInstallations/ModuleInstallationActions';

const DescriptionDiv = styled.div`
  max-height: 100px;
  overflow-y: auto;
  margin-bottom: 10px;
`;

interface IModuleCardProps {
  mod: ModuleOutputDTO;
  installation?: ModuleInstallationOutputDTO;
  onClick?: () => void;
  gameServerId: string;
}

export const ModuleInstallCard: FC<IModuleCardProps> = ({ mod, installation, gameServerId }) => {
  const theme = useTheme();
  const [isLatestSelected, setIsLatestSelected] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Card
        data-testid={`module-installation-${mod.name}-card`}
        style={isLatestSelected ? { borderColor: theme.colors.warning } : {}}
        ref={cardRef}
      >
        <Card.Body>
          <InnerBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{mod.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {installation && !installation.systemConfig['enabled'] && (
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Chip label="disabled" color="error" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      No module commands, hooks or cronjobs will be executed. Different from uninstalling the module,
                      the configuration is not removed.
                    </Tooltip.Content>
                  </Tooltip>
                )}

                {mod.author === 'Takaro' && (
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Chip color="primary" label="Official" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>This module is developed and maintained by the Takaro team.</Tooltip.Content>
                  </Tooltip>
                )}

                {installation && (
                  <>
                    <Tooltip>
                      <Tooltip.Trigger>
                        <Chip color="backgroundAccent" label={installation.version.tag} />
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <p>Installed version</p>
                      </Tooltip.Content>
                    </Tooltip>

                    <ModuleInstallationActions mod={mod} gameServerId={gameServerId} installation={installation} />
                  </>
                )}
              </div>
            </div>
            <DescriptionDiv>{mod.latestVersion.description}</DescriptionDiv>

            <SpacedRow>
              <span style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {mod.latestVersion.commands.length > 0 && <p>Commands: {mod.latestVersion.commands.length}</p>}
                {mod.latestVersion.hooks.length > 0 && <p>Hooks: {mod.latestVersion.hooks.length}</p>}
                {mod.latestVersion.cronJobs.length > 0 && <p>Cronjobs: {mod.latestVersion.cronJobs.length}</p>}
                {mod.latestVersion.permissions.length > 0 && <p>Permissions: {mod.latestVersion.permissions.length}</p>}
              </span>
            </SpacedRow>
            {!installation && (
              <ModuleVersionInstallForm
                moduleId={mod.id}
                gameServerId={gameServerId}
                onVersionTagSelected={(tag: string) =>
                  tag === 'latest' ? setIsLatestSelected(true) : setIsLatestSelected(false)
                }
              />
            )}
          </InnerBody>
        </Card.Body>
      </Card>
    </>
  );
};
