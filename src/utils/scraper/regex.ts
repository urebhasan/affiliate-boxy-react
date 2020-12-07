class Regex {
    getHostname(url: string) {
        const match = /(?:https?:\/\/)?([^/]+)/.exec(url);
        if (match) return match[1];
        return '';
    }

    getEndpoint(url: string) {
        let match = /(?<!https:\/)(?<!http:\/)\/[^/]+$/.exec(url);
        if (match) {
            match = /\/([^?]+)/.exec(match[0]);
            if (match) return match[1];
        }
        return '';
    }
}

export default new Regex();