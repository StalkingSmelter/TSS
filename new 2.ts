import { LibraryRequest } from '../../middleware/library_';
import { AsyncClientApi } from '../async-client-api_';
import { config } from '../config_';
import { Logger } from '../logger_';
import { addClientId } from '../utility/add-client-id_';

export interface InitiateRequest {
    websiteId: number;
    IlsName: string;
    IpAddress: string;
    PatronType: number;
    PrivateAccount: number;
    Puid: string;
    LoanStartDate: string;
    LoanEndDate: string;
}

export interface InitiateResponse {
    isSuccess: boolean;
    errorMessage: string;
    action: number;
    redirectUrl: string;
    refererPolicy: string;
    attributes: {
        service: string;
        code: string;
        SAMLResponse?: string;
    };
}

export class BTSAuthClient extends AsyncClientApi {
    public constructor() {
        super();
        this.host = config.BTS.authHostName!;
        this.logTags = ['BTS', 'BTS-AUTH'];
    }

    public async initiate(
        req: LibraryRequest,
        providerId: string,
        initiate: InitiateRequest
    ): Promise<InitiateResponse> {
        try {
            Logger.info(req, 'Initate BTS auth', [], {
                hostname: this.host,
                websiteId: initiate.websiteId,
                IlsName: initiate.IlsName,
                PatronType: initiate.PatronType,
                PrivateAccount: initiate.PrivateAccount,
                Puid: initiate.Puid,
                LoanStartDate: initiate.LoanStartDate,
                LoanEndDate: initiate.LoanEndDate,
            });
            const authToken = Buffer.from(
                `${process.env.BTS_AUTH_CLIENT_ID}:${process.env.BTS_AUTH_CLIENT_SECRET}`
            ).toString('base64');
            const path = addClientId(`/vendorAuth/initiate/${providerId}`);
            const response = await super.post<InitiateResponse>(
                req,
                path,
                initiate,
                true,
                {
                    Authorization: `Basic ${authToken}`,
                    'Content-Type': 'application/json',
                },
                true
            );
            Logger.debug(req, 'Recieved BTS auth response', [], {
                BTSAuthRepsonseBody: response.body!,
                status: response.statusCode,
            });
            return response.body!;
        } catch (error) {
            Logger.error(req, 'Error from Vendor Auth', [], {
                BTSAuthError: error,
            });
            return {} as InitiateResponse;
        }
    }

    public async getRonkSignUpUrl(
        req: LibraryRequest,
        websiteId: number,
        accountId: number
    ): Promise<string> {
        const authToken = Buffer.from(
            `${process.env.BTS_AUTH_CLIENT_ID}:${process.env.BTS_AUTH_CLIENT_SECRET}`
        ).toString('base64');
        const path = addClientId(
            `/Ronk/${encodeURIComponent(
                websiteId
            )}/signupUrl/${encodeURIComponent(accountId)}`
        );
        const response = await super.get<string>(
            req,
            path,
            {
                Authorization: `Basic ${authToken}`,
                'Content-Type': 'application/json',
            },
            true
        );
        return response.body!;
    }
}