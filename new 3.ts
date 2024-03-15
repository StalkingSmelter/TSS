import { LibraryRequest } from '../../middleware/library_';
import { AsyncClientApi } from '../async-client-api_';
import { buildKey, getOrCreateAsync } from '../cache-utils_';
import { config } from '../config_';
import { Provider } from './provider_';
import { addClientId } from '../utility/add-client-id_';


export class BTSApiClient extends AsyncClientApi {
    public constructor() {
        super();
        this.host = config.BTS.apiHostname!;
        this.logTags = ['BTS', 'BTS-API'];
    }

    private async getProviderSubscriptionsFromApi(
        req: LibraryRequest,
        path: string
    ) {
        const finalPath = addClientId(path);
        const response = await super.get<Provider[]>(req, finalPath, {
            'Accept-Language': (req.query.locale as string) ?? 'en-us',
        });
        return response.body!;
    }

    public async getProviderSubscriptions(
        req: LibraryRequest,
        libraryKey: string
    ): Promise<Provider[]> {
        const path = `/v1/provider-subscriptions?libraryKey=${encodeURIComponent(
            libraryKey
        )}`;
        const cacheKey = buildKey([
            'getProviderSubscriptions',
            libraryKey,
            path,
            req.locale || '*',
        ]);

        return getOrCreateAsync(req, cacheKey, async () =>
            this.getProviderSubscriptionsFromApi(req, path)
        );
    }
}