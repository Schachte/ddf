/*
 * Copyright (c) Codice Foundation
 *
 * <p>This is free software: you can redistribute it and/or modify it under the terms of the GNU
 * Lesser General Public License as published by the Free Software Foundation, either version 3 of
 * the License, or any later version.
 *
 * <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details. A copy of the GNU Lesser General Public
 * License is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 */
package org.codice.ddf.catalog.template;

import java.io.StringBufferInputStream;
import org.geotools.filter.FilterTransformer;
import org.geotools.filter.text.cql2.CQL;
import org.geotools.xml.Parser;
import org.opengis.filter.Filter;

public class TemplateProvider {
  public static void main(String[] args) throws Exception {
    Filter filter = CQL.toFilter("attName >= 5");

    FilterTransformer transformer = new FilterTransformer();
    transformer.setIndentation(2);

    String xml = transformer.transform(filter);
    print(xml);

    Parser parser = new Parser(new org.geotools.filter.v1_0.OGCConfiguration());
    //    Parser parser = new Parser(new org.geotools.filter.v2_0.FESConfiguration());
    Filter f = (Filter) parser.parse(new StringBufferInputStream(xml));
    print(f.toString());
  }

  private static void print(String msg) {
    System.out.println(msg);
  }
}
