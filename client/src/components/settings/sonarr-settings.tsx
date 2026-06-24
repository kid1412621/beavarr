import { useAppFormContext } from '@/lib/form';
import { type SettingsForm } from '@/lib/types';

import {
    ConnectableFields,
    ConnectableHeader,
    useConnectableTest,
} from './connectable-settings';

export function SonarrSettings() {
    const form = useAppFormContext<SettingsForm>();
    const {
        status: testStatus,
        setStatus: setTestStatus,
        testConnection,
    } = useConnectableTest('sonarr', 'sonarrUrl', 'sonarrApiKey');

    return (
        <form.Subscribe
            selector={(state) => [
                state.values.sonarrUrl,
                state.values.sonarrApiKey,
            ]}
        >
            {([sonarrUrl, sonarrApiKey]) => (
                <div className="space-y-4">
                    <ConnectableHeader
                        title="Sonarr"
                        serviceName="Sonarr"
                        status={testStatus}
                        onConnect={testConnection}
                        disabled={!sonarrUrl || !sonarrApiKey}
                    />

                    <ConnectableFields
                        serviceName="Sonarr"
                        urlName="sonarrUrl"
                        apiKeyName="sonarrApiKey"
                        urlPlaceholder="http://localhost:8989"
                        apiKeyHelperUrl={
                            sonarrUrl
                                ? `${sonarrUrl.replace(/\/$/, '')}/settings/general`
                                : undefined
                        }
                        onResetStatus={() => setTestStatus('idle')}
                    />
                </div>
            )}
        </form.Subscribe>
    );
}
