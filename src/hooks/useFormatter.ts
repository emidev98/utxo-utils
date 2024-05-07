
const useFormatter = () => {

    // TODO: crete a setting for the user to toggel display 
    // between sats or btc
    const BTCFormatter = (value: number) => {
        return (value / 100000000) + " ₿"
    }

    return {
        BTCFormatter
    }
}

export default useFormatter;