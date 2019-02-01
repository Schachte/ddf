package ddf.catalog.impl.filter;

import org.geotools.filter.FunctionImpl;
import org.opengis.filter.Filter;

/**
 * Allows us to extend the capability of a standard geotools filter function by baking in the
 * conversion of a given ECQL filter into a filter that can be interpreted to follow the actual CQL
 * specification.
 */
public abstract class CustomFunctionImpl extends FunctionImpl {
  public Filter retrieveProxyFilter(Filter filter) {
    return filter;
  };
}
