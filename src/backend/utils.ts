import { execSync } from 'child_process';

export function getOs() {
	let platform : NodeJS.Platform = process.platform;
	switch (platform) {
		case 'win32':
			return 'Windows';
		case 'linux':
			return 'Linux';
		case 'darwin':
			return 'MacOS';
		default:
			return 'unknown';
	}
};

export function getMachineId() {
	const execPath = {
        darwin: 'ioreg -rd1 -c IOPlatformExpertDevice',
        win32: `%windir%/System32/REG.exe ` +
            'QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography ' +
            '/v MachineGuid',
        linux: '( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :',
        freebsd: 'kenv -q smbios.system.uuid || sysctl -n kern.hostuuid',
    } as any;
	try {
		const execResult = execSync(execPath[process.platform]).toString();
		function extract (result: string) {
			switch (process.platform) {
				case 'darwin':
					return result
						.split('IOPlatformUUID')[1]
						.split('\n')[0].replace(/\=|\s+|\"/ig, '')
						.toLowerCase();
				case 'win32':
					return result
						.toString()
						.split('REG_SZ')[1]
						.replace(/\r+|\n+|\s+/ig, '')
						.toLowerCase();
				case 'linux':
					return result
						.toString()
						.replace(/\r+|\n+|\s+/ig, '')
						.toLowerCase();
				case 'freebsd':
					return result
						.toString()
						.replace(/\r+|\n+|\s+/ig, '')
						.toLowerCase();
				default:
					throw new Error(`Unsupported platform: ${process.platform}`);
			}
		}
		return extract(execResult);
	} catch (error) {
		return undefined;		
	}
}
