import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import {
    ConnectableFields,
    ConnectableHeader,
    useConnectableTest,
} from './connectable-settings';

export function RadarrSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        testConnection,
    } = useConnectableTest('radarr', 'radarrUrl', 'radarrApiKey');

    return (
        <form.Subscribe
            selector={(state) => [
                state.values.radarrUrl,
                state.values.radarrApiKey,
            ]}
        >
            {([radarrUrl, radarrApiKey]) => (
                <div className="space-y-4">
                    <ConnectableHeader
                        title="Radarr"
                        serviceName="Radarr"
                        status={testStatus}
                        onConnect={testConnection}
                        disabled={!radarrUrl || !radarrApiKey}
                    />

                    <ConnectableFields
                        serviceName="Radarr"
                        urlName="radarrUrl"
                        apiKeyName="radarrApiKey"
                        urlPlaceholder="http://localhost:7878"
                        apiKeyHelperUrl={
                            radarrUrl
                                ? `${radarrUrl.replace(/\/$/, '')}/settings/general`
                                : undefined
                        }
                        onResetStatus={() => setTestStatus('idle')}
                    />
                </div>
            )}
        </form.Subscribe>
    );
}
