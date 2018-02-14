package org.codice.ddf.catalog.ui.metacard.template;

import java.io.StringBufferInputStream;
import org.geotools.filter.FilterTransformer;
import org.geotools.filter.text.cql2.CQL;
import org.geotools.xml.Parser;
import org.opengis.filter.Filter;

public class TemplateService {

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
