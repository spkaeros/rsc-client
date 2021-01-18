 // let MODULUS = bigInt('121727957757863576101561860005285292626079113266451124223351027655156011238254177877652729098983576274837395085392103662934978533548660507677480253506715648449246069310428873797293036242698272731265802720055413141023411018398284944110799347717001885969188133010830020603318079626459849229187149790609728348667', 10);
// let EXPONENT = bigInt('12256971504525176577999115521306614075749098639988274452692554670619288210288814203087336665303501555493198422881032409199392946347224070978354126295353401', 10);
let MODULUS = 7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789n;
let EXPONENT = 58778699976184461502525193738213253649000149147835990136706041084440742975821n;

BigInt.prototype.toArray = function(base = 256n) {
	if (typeof base === 'number')
		base = BigInt(base);
	else if (typeof base !== 'bigint')
		base = 256n;

	let arr = [];

	for (let other = BigInt(this); other > 0; other /= base)
		arr.unshift(Number(other%base));
	return arr;
};

BigInt.prototype.modPow = function (exp, mod) {
    var r = 1n, base = this % mod;
    while (exp > 0n) {
        if (base == 0n) return 0n;
        if (exp&1n) r = (r * base) % mod;
        exp /= 2n;
        base = (base*base) % mod;
    }
    return r;
};

BigInt.fromArray = (arr) => {
	let bi = 0n;
	for (let i in arr)
		bi |= BigInt(arr[i]) << BigInt((arr.length-1-i)<<3);
	return bi;
};

function encryptBytes(arr) {
	return BigInt.fromArray(arr).modPow(EXPONENT, MODULUS).toArray();
}

module.exports = encryptBytes;
