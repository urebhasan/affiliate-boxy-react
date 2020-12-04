declare module 'comlink-loader!*' {
    class Scraper extends Worker {
        constructor();

        scrapeSite(hostname: string, storeDomains: { [key: string]: string[] }): Promise<void>;
    }

    export = Scraper;
}