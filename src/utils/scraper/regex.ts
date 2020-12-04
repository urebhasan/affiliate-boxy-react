class Regex {
    getHostname(url: string) {
        const match = url.match(/(?:http[s]?:\/\/)?([^/]+)/)
        if (match) return match[1];
        return '';
    }

    getEndpoint(url: string) {
        let match = url.match(/(?<!https:\/)\/[^/]+$/);
        if (match) {
            match = match[0].match(/\/([^?]+)/);
            if (match) return match[1];
        }
        return '';
    }
}

export default new Regex();