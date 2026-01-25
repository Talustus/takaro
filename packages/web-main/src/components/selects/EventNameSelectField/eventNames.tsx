import { EventOutputDTOEventNameEnum as e, EventOutputDTOEventNameEnum } from '@takaro/apiclient';

// Compile-time check: TypeScript will error if any enum value is missing
const eventToCategory: Record<EventOutputDTOEventNameEnum, string> = {
  [e.ModuleCreated]: 'Module',
  [e.ModuleUpdated]: 'Module',
  [e.ModuleDeleted]: 'Module',
  [e.ModuleInstalled]: 'Module',
  [e.ModuleUninstalled]: 'Module',
  [e.CronjobExecuted]: 'Module',
  [e.HookExecuted]: 'Module',
  [e.CommandExecuted]: 'Module',
  [e.CommandExecutionDenied]: 'Module',

  [e.PlayerCreated]: 'Player',
  [e.PlayerConnected]: 'Player',
  [e.PlayerDisconnected]: 'Player',
  [e.PlayerNewIpDetected]: 'Player',
  [e.PlayerNewNameDetected]: 'Player',
  [e.PlayerDeath]: 'Player',
  [e.PlayerLinked]: 'Player',
  [e.PlayerBanned]: 'Player',
  [e.PlayerUnbanned]: 'Player',
  [e.PlayerDeleted]: 'Player',

  [e.GameserverCreated]: 'Game Server',
  [e.GameserverUpdated]: 'Game Server',
  [e.GameserverDeleted]: 'Game Server',
  [e.ChatMessage]: 'Game Server',
  [e.EntityKilled]: 'Game Server',
  [e.ServerStatusChanged]: 'Game Server',

  [e.CurrencyAdded]: 'Economy',
  [e.CurrencyDeducted]: 'Economy',
  [e.CurrencyResetAll]: 'Economy',
  [e.ShopOrderCreated]: 'Economy',
  [e.ShopOrderStatusChanged]: 'Economy',
  [e.ShopOrderDeliveryFailed]: 'Economy',
  [e.ShopListingCreated]: 'Economy',
  [e.ShopListingUpdated]: 'Economy',
  [e.ShopListingDeleted]: 'Economy',

  [e.RoleAssigned]: 'Role',
  [e.RoleRemoved]: 'Role',
  [e.RoleCreated]: 'Role',
  [e.RoleUpdated]: 'Role',
  [e.RoleDeleted]: 'Role',

  [e.SettingsSet]: 'Other',
};

// Derive categorized structure from the mapping
export const categorizedEventNames = Object.entries(
  Object.entries(eventToCategory).reduce(
    (acc, [event, category]) => {
      if (!acc[category]) acc[category] = [];
      acc[category].push(event as EventOutputDTOEventNameEnum);
      return acc;
    },
    {} as Record<string, EventOutputDTOEventNameEnum[]>,
  ),
).map(([category, events]) => ({ category, events }));
