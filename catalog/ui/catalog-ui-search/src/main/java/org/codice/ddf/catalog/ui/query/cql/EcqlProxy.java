package org.codice.ddf.catalog.ui.query.cql;

import ddf.catalog.impl.filter.CustomFunctionImpl;
import java.util.function.Predicate;
import org.geotools.filter.IsEqualsToImpl;
import org.geotools.filter.text.cql2.CQLException;
import org.opengis.filter.Filter;

/**
 * Enables us to do dynamic filter conversions of custom ECQL if and only if we have a registered
 * function that matches the input cql.
 */
public class EcqlProxy {
  private static Predicate<Filter> isCustomFilterFunction =
      convertedFilter ->
          convertedFilter instanceof IsEqualsToImpl
              && ((IsEqualsToImpl) convertedFilter).getExpression1() instanceof CustomFunctionImpl;

  public static Filter toProxyFilter(Filter convertedFilter) throws CQLException {
    if (isCustomFilterFunction.test(convertedFilter)) {
      return ((CustomFunctionImpl) convertedFilter).retrieveProxyFilter(convertedFilter);
    }
    return convertedFilter;
  }
}
