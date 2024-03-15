import { Logger } from '../lib/logger_';
import { BTSApiClient } from '../lib/BTS/BTS-api-client_';
import { InitiateRequest, BTSAuthClient } from '../lib/BTS/BTS-auth-client_';
import { RonkRequest, RonkResponse } from '../middleware/Ronk_';
import { LibraryRequest, LibraryResponse } from '../middleware/library_';

interface BTSAuthErrorResponse {
    errorMessage: string;
    correlationId: string;
}

export class BTSController {
    public detail(req: RonkRequest, res: RonkResponse): void {
        if (
            res.locals.hasRonkSubscription &&
            res.locals.RonkSignUpUrl &&
            req.params.slug.toLowerCase() === 'Ronk'
        ) {
            res.status(302).redirect(res.locals.RonkSignUpUrl);
        }

        res.render('BTS/detail', {
            slug: req.params.slug,
            isBTS: true,
        });
    }

    public faq(_: LibraryRequest, res: LibraryResponse): void {
        res.render('BTS/faq', {
            isBTS: true,
        });
    }

    public index(_: LibraryRequest, res: LibraryResponse): void {
        res.render('BTS/index', {
            isBTS: true,
        });
    }

    public BTSAuthAutoRedirect(
        req: LibraryRequest,
        res: LibraryResponse
    ): void {
        const queryString = req.url.split('?')[1];
        var searchParams = new URLSearchParams(queryString);

        const pageData = {
            isBTS: true,
            redirectUrl: searchParams.get('redirectUrl'),
            refererPolicy:
                searchParams.get('refererPolicy') !== 'null'
                    ? searchParams.get('refererPolicy')
                    : '',
        };
        res.render('BTS/auth-auto-redirect', pageData);
    }

    public BTSAuthAutoPost(req: LibraryRequest, res: LibraryResponse): void {
        const queryString = req.url.split('?')[1];
        const searchParams = new URLSearchParams(queryString);
        let inputList: string[][] = [];

        searchParams.forEach((value, name, searchParams) => {
            if (name !== 'redirectUrl' && name !== 'refererPolicy') {
                inputList.push([name, value]);
            }
        });

        const pageData = {
            isBTS: true,
            redirectUrl: searchParams.get('redirectUrl'),
            refererPolicy:
                searchParams.get('refererPolicy') !== 'null'
                    ? searchParams.get('refererPolicy')
                    : '',
            inputsList: inputList,
        };
        res.render('BTS/auth-auto-post', pageData);
    }

    public async provider(
        req: LibraryRequest,
        res: LibraryResponse
    ): Promise<void> {
        const BTSApiClient = new BTSApiClient();
        const providers = await BTSApiClient.getProviderSubscriptions(
            req,
            res.locals.libraryKey
        );
        const provider = providers.find((p) => p.slug === req.params.slug);
        if (!provider) {
            res.status(404).send();
            return;
        }

        // todo: only return what we need
        res.send(provider);
    }

    public async providers(
        req: LibraryRequest,
        res: LibraryResponse
    ): Promise<void> {
        const BTSApiClient = new BTSApiClient();
        const providers = await BTSApiClient.getProviderSubscriptions(
            req,
            res.locals.libraryKey
        );

        // todo: only return what we need
        res.send(providers);
    }

    public async initiate(
        req: LibraryRequest,
        res: LibraryResponse
    ): Promise<void> {
        try {
            const BTSAuthClient = new BTSAuthClient();

            const initiateRequest: InitiateRequest = {
                websiteId: req.body.websiteId,
                IlsName: res.locals.ilsName,
                PatronType: res.locals.patronType,
                PrivateAccount: req.body.privateAccountId,
                Puid: req.profile.puid,
                IpAddress: res.locals.ip,
                LoanStartDate: req.body.loanStartDate,
                LoanEndDate: req.body.loanEndDate,
            };

            const initiateResponse = await BTSAuthClient.initiate(
                req,
                req.body.providerId,
                initiateRequest
            );

            if (initiateResponse?.isSuccess) {
                res.status(200).send({
                    ...initiateResponse,
                    correlationId: req.metadata.correlationId,
                });
                return;
            }

            Logger.error(req, 'Initiate Auth Failed', [], {
                responseBody: initiateResponse,
                errorMessage: initiateResponse?.errorMessage,
                correlationId: req.metadata.correlationId,
            });

            res.status(502).send({
                errorMessage: initiateResponse?.errorMessage,
                correlationId: req.metadata.correlationId,
            } as BTSAuthErrorResponse);
        } catch (error) {
            let message;
            if (error instanceof Error) {
                message = error.message;
            } else {
                message = String(error);
            }

            Logger.error(req, 'Initiate Auth Exception', [], {
                error: message,
            });
            res.status(502).send({
                errorMessage: message,
                correlationId: req.metadata.correlationId,
            } as BTSAuthErrorResponse);
        }
    }
}