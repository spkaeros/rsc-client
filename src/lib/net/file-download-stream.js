import fetch from 'node-fetch';

async function download(url) {
	if (!url || !url.length) {
		return;
	}

	return new Promise(async (resolve, reject) => {
		await fetch(url).then((res) => {
			if (res.status === 200)
				return res.arrayBuffer();
			reject(res);
		}).then((data) => {
			resolve(Buffer.from(data));
		});
	});
}


export {
	download as default,
	download,
}
