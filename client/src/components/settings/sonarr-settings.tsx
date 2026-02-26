import {
    ConnectableFields,
    ConnectableHeader,
    useConnectableTest,
} from './connectable-settings';

export function SonarrSettings({ form }: { form: any }) {
    const {
        status: testStatus,
        setStatus: setTestStatus,
        testConnection,
    } = useConnectableTest(form, 'sonarr', 'sonarrUrl', 'sonarrApiKey');

    return (
        <div className="space-y-4">
            <ConnectableHeader
                title="Sonarr"
                serviceName="Sonarr"
                status={testStatus}
                onConnect={testConnection}
                disabled={
                    !form.getFieldValue('sonarrUrl') ||
                    !form.getFieldValue('sonarrApiKey')
                }
            />

            <ConnectableFields
                form={form}
                serviceName="Sonarr"
                urlName="sonarrUrl"
                apiKeyName="sonarrApiKey"
                urlPlaceholder="http://localhost:8989"
                apiKeyHelperUrl={
                    form.getFieldValue('sonarrUrl')
                        ? `${form.getFieldValue('sonarrUrl').replace(/\/$/, '')}/settings/general`
                        : undefined
                }
                onResetStatus={() => setTestStatus('idle')}
            />
        </div>
    );
}
