import {
    ConnectableFields,
    ConnectableHeader,
    useConnectableTest,
} from './connectable-settings';

export function RadarrSettings({ form }: { form: any }) {
    const {
        status: testStatus,
        setStatus: setTestStatus,
        testConnection,
    } = useConnectableTest(form, 'radarr', 'radarrUrl', 'radarrApiKey');

    return (
        <div className="space-y-4">
            <ConnectableHeader
                title="Radarr"
                serviceName="Radarr"
                status={testStatus}
                onConnect={testConnection}
                disabled={
                    !form.getFieldValue('radarrUrl') ||
                    !form.getFieldValue('radarrApiKey')
                }
            />

            <ConnectableFields
                form={form}
                serviceName="Radarr"
                urlName="radarrUrl"
                apiKeyName="radarrApiKey"
                urlPlaceholder="http://localhost:7878"
                apiKeyHelperUrl={
                    form.getFieldValue('radarrUrl')
                        ? `${form.getFieldValue('radarrUrl').replace(/\/$/, '')}/settings/general`
                        : undefined
                }
                onResetStatus={() => setTestStatus('idle')}
            />
        </div>
    );
}
