import React from "react";
import { Box, Flex, Subhead, Truncate } from "rebass";
import { Link, withRouter } from "react-router";

import * as Urls from "metabase/lib/urls";
import { normal } from "metabase/lib/colors";

import { CollectionsApi } from "metabase/services";

import Icon from "metabase/components/Icon";
import CollectionListLoader from "metabase/components/CollectionListLoader";
import CollectionItemsLoader from "metabase/components/CollectionItemsLoader";
import EntityMenu from "metabase/components/EntityMenu";

//import SegmentList from "metabase/components/SegmentList";
//import MetricList from "metabase/components/MetricList";

import LandingNav from "metabase/components/LandingNav";

const Card = Box.extend`
  background-color: white;
  border: 1px solid ${normal.grey1};
  border-radius: 6px;
  box-shadow: 0 1px 3px ${normal.grey1};
`;

const CollectionItem = ({ collection }) => (
  <Link to={`collections/${collection.slug}`}>
    <Card>
      <Flex
        align="center"
        my={1}
        px={1}
        py={1}
        key={`collection-${collection.id}`}
      >
        <Icon name="all" mx={2} />
        <Truncate>{collection.name}</Truncate>
      </Flex>
    </Card>
  </Link>
);

const CollectionList = ({ collectionSlug }) => {
  return (
    <Box mb={2}>
      <CollectionListLoader>
        {({ collections, loading, error }) => {
          if (loading) {
            return <Box>Loading...</Box>;
          }
          return (
            <Grid>
              {collections.map(collection => (
                <GridItem>
                  <CollectionItem collection={collection} />
                </GridItem>
              ))}
            </Grid>
          );
        }}
      </CollectionListLoader>
    </Box>
  );
};

const GridItem = ({ children, w, px, py }) => (
  <Box w={w} px={px} py={py}>
    {children}
  </Box>
);

GridItem.defaultProps = {
  w: 1 / 4,
  px: 1,
  py: 1,
};

const Grid = ({ children }) => (
  <Flex wrap mx={-2}>
    {children}
  </Flex>
);

const ItemCard = ({ children, background }) => {
  return (
    <Box
      style={{
        backgroundColor: background ? background : "#F8F8FA",
        border: "1px solid #EEF0f1",
        borderRadius: 6,
        height: 140,
      }}
      className="text-brand-hover"
      p={2}
    >
      <Flex direction="column" style={{ height: "100%" }}>
        {children}
      </Flex>
    </Box>
  );
};

@withRouter
class DefaultLanding extends React.Component {
  _renderItem(item) {
    switch (item.type) {
      case "card":
        return (
          <Link to={Urls.question(item.id)}>
            <ItemCard>
              <Icon name="beaker" />
              <Truncate mt="auto">{item.name}</Truncate>
            </ItemCard>
          </Link>
        );
      case "dashboard":
        return (
          <Link to={Urls.dashboard(item.id)}>
            <ItemCard background="white">
              <Icon name="dashboard" color={normal.blue} />
              <Truncate mt="auto">{item.name}</Truncate>
            </ItemCard>
          </Link>
        );
      case "pulse":
        return (
          <Flex direction="column">
            <ItemCard>
              <Icon name="pulse" color={normal.yellow} />
              <Truncate mt="auto">{item.name}</Truncate>
            </ItemCard>
          </Flex>
        );
    }
  }
  render() {
    const { currentCollection, collectionSlug, location } = this.props;
    return (
      <Box w="100%">
        {// HACK for now to only show the colleciton list on the root
        // colleciton until we have a notion of nested collections
        !collectionSlug && <CollectionList />}
        <CollectionItemsLoader collectionId={currentCollection.id}>
          {({ loading, error, allItems, pulses, cards, dashboards }) => {
            if (loading) {
              return <Box>Loading...</Box>;
            }

            let items = allItems;

            // Hack in filtering
            if (location.query.show) {
              switch (location.query.show) {
                case "dashboards":
                  items = dashboards.map(d => ({ ...d, type: "dashboard" }));
                  break;
                case "pulses":
                  items = pulses.map(p => ({ ...p, type: "pulse" }));
                  break;
                case "questions":
                  items = cards.map(c => ({ ...c, type: "card" }));
                  break;
                default:
                  items = allItems;
                  break;
              }
            }

            return (
              <Grid>
                {items.map(item => (
                  <GridItem>{this._renderItem(item)}</GridItem>
                ))}
              </Grid>
            );
          }}
        </CollectionItemsLoader>
      </Box>
    );
  }
}

class CollectionLanding extends React.Component {
  state = {
    collections: [],
  };
  componentWillMount() {
    this._loadCollections();
  }
  /* quick hack to look up collection information for slug matching,
   * this will eventually happen in redux land */
  async _loadCollections() {
    try {
      const collections = await CollectionsApi.list();
      this.setState({ collections });
    } catch (error) {}
  }
  render() {
    const { children } = this.props;
    const collectionSlug = this.props.params.collectionSlug;
    if (!this.state.collections) {
      return <Box>Loading...</Box>;
    }
    /* TODO - this will live in redux land  */
    const currentCollection =
      this.state.collections.filter(c => c.slug === collectionSlug)[0] || {};
    return (
      <Box>
        <Box className="wrapper lg-wrapper--trim">
          <Flex py={3}>
            {/* TODO - this should be the collection or instance name */}
            <Subhead>
              <Flex align="center">
                <Flex>
                  {/* TODO - figure out the right way to grab this */}
                  <Link to="/">{window.MetabaseBootstrap.site_name}</Link>
                </Flex>
                {currentCollection.name && (
                  <Flex align="center">
                    <Icon name="chevronright" m={2} />
                    <Flex>
                      <Link to={`/collections/${currentCollection.slug}`}>
                        {currentCollection.name}
                      </Link>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Subhead>

            <Box ml="auto">
              <EntityMenu
                items={[
                  {
                    title: "Edit this collection",
                    link: "/test",
                    icon: "editdocument",
                  },
                ]}
                triggerIcon="pencil"
              />
            </Box>
          </Flex>
        </Box>
        <Box className="relative">
          <LandingNav collectionSlug={collectionSlug} />
          <Box className="wrapper lg-wrapper--trim">
            {children ? (
              children
            ) : (
              <DefaultLanding
                currentCollection={currentCollection}
                collectionSlug={collectionSlug}
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  }
}

export default CollectionLanding;