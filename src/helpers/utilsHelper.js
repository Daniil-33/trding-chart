export function formatCurrency(number, currency='USD') {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency }).format(number)
}

export function generateRandomSignals(dataset, count=5) {
	const signals = [];

    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * dataset.length);
        const data = dataset[randomIndex];

        const signal = {
            x: data.x,
            y: '',
            type: ''
        };

		const type = ['buy', 'sell'].at(Math.round(Math.random()))

        if (type === 'buy') {
            signal.y = data.l;
            signal.type = 'buy';
        } else {
            signal.y = data.h;
            signal.type = 'sell';
        }

        signals.push(signal);
    }

    return signals;
}