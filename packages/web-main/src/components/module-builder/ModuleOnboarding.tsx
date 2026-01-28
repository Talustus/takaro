import { FC, PropsWithChildren } from 'react';
import { Card, FormError, styled } from '@takaro/lib-components';
import { useCommandCreate, useCronJobCreate, useHookCreate } from '../../queries/module';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ModuleVersionOutputDTO } from '@takaro/apiclient';

const Flex = styled.div<{ justifyContent?: string }>`
  display: flex;
  flex-direction: column;
  justify-content: ${({ justifyContent }) => justifyContent || 'space-between'};
  row-gap: ${({ theme }) => theme.spacing[1]};
  height: 100%;
`;

const Grid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, 1fr);
  height: 250px;
  gap: 0 ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[0]};
`;

const Title = styled.h1`
  text-align: center;
  font-size: 3.5rem;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  margin: auto;
  margin-top: -200px;
  height: 100vh;

  max-width: ${({ theme }) => theme.breakpoint.large};
`;

export type ModuleOnboardingProps = {
  moduleVersion: ModuleVersionOutputDTO;
};

export const ModuleOnboarding: FC<ModuleOnboardingProps> = ({ moduleVersion }) => {
  const { mutate: createHook, error: createHookError } = useHookCreate();
  const { mutate: createCommand, error: createCommandError } = useCommandCreate();
  const { mutate: createCronJob, error: createCronJobError } = useCronJobCreate();
  const navigate = useNavigate();
  const { moduleVersionTag } = useParams({ from: '/_auth/module-builder/$moduleId/$moduleVersionTag' });

  const { moduleId, id: versionId } = moduleVersion;

  const onSuccess = () => {
    navigate({
      to: '/module-builder/$moduleId/$moduleVersionTag',
      params: { moduleId: moduleVersion.moduleId, moduleVersionTag },
    });
  };

  const createComponent = (componentType: 'hook' | 'cronjob' | 'command') => {
    switch (componentType) {
      case 'hook':
        createHook(
          {
            versionId,
            moduleId,
            hook: {
              name: 'my-hook',
              eventType: 'log',
              versionId,
              regex: 'takaro-hook-regex-placeholder',
            },
          },
          { onSuccess },
        );
        break;
      case 'cronjob':
        createCronJob(
          {
            versionId,
            moduleId,
            cronJob: {
              name: 'my-cronjob',
              temporalValue: '5 4 * * *',
              versionId,
            },
          },
          { onSuccess },
        );
        break;
      case 'command':
        createCommand(
          {
            moduleId,
            versionId,
            command: {
              name: 'my-command',
              versionId,
              trigger: 'test',
            },
          },
          { onSuccess },
        );
        break;
    }
  };

  return (
    <Wrapper>
      <Title>Choose one to get started</Title>
      <Grid columns={3}>
        <InfoCard title="Commands" onClick={() => createComponent('command')}>
          Commands are triggered by a user. They are triggered when a player sends a chat message starting with the
          configured command prefix. Note that this means that commands are a manual action, unlike Hooks and Cronjobs
          which are triggered with any user-intervention.
        </InfoCard>
        <InfoCard title="Hooks" onClick={() => createComponent('hook')}>
          Hooks are triggered when a certain event happens on a Gameserver. Think of it as a callback function that is
          executed when a certain event happens. For example, when a player joins a server, a Hook can be triggered that
          will send a message to the player.
        </InfoCard>
        <InfoCard title="CronJobs" onClick={() => createComponent('cronjob')}>
          Cronjobs are triggered based on time. This can be a simple repeating pattern like "Every 5 minutes" or "Every
          day" or you can use raw Cron (opens in a new tab) syntax to define more complex patterns like "Every Monday,
          Wednesday and Friday at 2 PM".
        </InfoCard>
      </Grid>
      {createCronJobError && <FormError error={createCronJobError} />}
      {createHookError && <FormError error={createHookError} />}
      {createCommandError && <FormError error={createCommandError} />}
    </Wrapper>
  );
};

type InfoCardProps = {
  title: string;
  onClick?: (e: React.MouseEvent) => void;
};

export const InfoCard: FC<PropsWithChildren<InfoCardProps>> = ({ title, onClick, children }) => {
  const handleClick = (e: React.MouseEvent) => {
    // stops the parent onClick from firing
    e.stopPropagation();
  };

  return (
    <Card onClick={onClick}>
      <Card.Title label={title}></Card.Title>
      <Card.Body>
        <Flex>
          {children}
          <a
            className="underline"
            href={`https://docs.takaro.io/advanced/modules#${title.toLowerCase()}`}
            target="_blank"
            rel="noreferrer noopener"
            onClick={handleClick}
          >
            Learn more
          </a>
        </Flex>
      </Card.Body>
    </Card>
  );
};
