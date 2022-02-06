/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect } from "react";
import type { RefObject } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogExplorerCardsProps } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useSplashScreen } from "onyxia-ui";
import { useSelector, useThunks, selectors } from "ui/coreApi";
import { routes } from "ui/routes";
import type { Route } from "type-route";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogExplorer = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const catalogExplorerState = useSelector(state => state.catalogExplorer);

    const { catalogExplorerThunks } = useThunks();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        switch (catalogExplorerState.stateDescription) {
            case "not fetched":
                if (!catalogExplorerState.isFetching) {
                    showSplashScreen({ "enableTransparency": true });
                    catalogExplorerThunks.fetchCatalogs();
                }
                break;
            case "not selected":
                catalogExplorerThunks.selectCatalog({
                    "catalogId":
                        route.params.catalogId ??
                        catalogExplorerState.availableCatalogsId[0],
                });
                break;
            case "ready":
                hideSplashScreen();
                if (route.params.catalogId !== catalogExplorerState.selectedCatalogId) {
                    routes
                        .catalogExplorer({
                            "catalogId": catalogExplorerState.selectedCatalogId,
                        })
                        [route.params.catalogId === undefined ? "replace" : "push"]();
                }
                break;
        }
    }, [
        catalogExplorerState.stateDescription,
        route.params.catalogId,
        catalogExplorerState.stateDescription !== "ready"
            ? undefined
            : catalogExplorerState.selectedCatalogId,
    ]);

    const onRequestLaunch = useConstCallback<
        CatalogExplorerCardsProps["onRequestLaunch"]
    >(packageName =>
        routes
            .catalogLauncher({
                "catalogId": route.params.catalogId!,
                packageName,
            })
            .push(),
    );

    const onSearchChange = useConstCallback<CatalogExplorerCardsProps["onSearchChange"]>(
        search =>
            routes
                .catalogExplorer({
                    "catalogId": route.params.catalogId!,
                    "search": search || undefined,
                })
                .replace(),
    );

    useEffect(() => {
        catalogExplorerThunks.setSearch({ "search": route.params.search });
    }, [route.params.search]);

    const onRequestRevealPackagesNotShown = useConstCallback(() =>
        catalogExplorerThunks.revealAllPackages(),
    );

    const { filteredPackages } = useSelector(selectors.catalogExplorer.filteredPackages);

    if (catalogExplorerState.stateDescription !== "ready") {
        return null;
    }

    assert(filteredPackages !== undefined);

    const { packages, notShownCount } = filteredPackages;

    return (
        <CatalogExplorerCards
            search={route.params.search}
            onSearchChange={onSearchChange}
            className={className}
            packages={packages}
            onRequestLaunch={onRequestLaunch}
            scrollableDivRef={scrollableDivRef}
            onRequestRevealPackagesNotShown={onRequestRevealPackagesNotShown}
            notShownPackageCount={notShownCount}
        />
    );
});
