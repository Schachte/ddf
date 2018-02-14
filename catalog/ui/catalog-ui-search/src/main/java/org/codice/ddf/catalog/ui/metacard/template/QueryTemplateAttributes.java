package org.codice.ddf.catalog.ui.metacard.template;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import ddf.catalog.data.AttributeDescriptor;
import ddf.catalog.data.MetacardType;
import ddf.catalog.data.impl.AttributeDescriptorImpl;
import ddf.catalog.data.impl.BasicTypes;
import java.util.Map;
import java.util.Set;

public class QueryTemplateAttributes implements MetacardType {
  public static final String TEMPLATE_CQL = "template_cql";

  public static final String QUERY_DESCRIPTORS = "query_descriptors";

  public static final String NAME = "template_query";

  // @formatter:off
  private static final Map<String, AttributeDescriptor> DESCRIPTORS =
      ImmutableMap.of(
          TEMPLATE_CQL,
          new AttributeDescriptorImpl(
              TEMPLATE_CQL,
              false /* indexed */,
              true /* stored */,
              false /* tokenized */,
              false /* multivalued */,
              BasicTypes.STRING_TYPE),
          QUERY_DESCRIPTORS,
          new AttributeDescriptorImpl(
              QUERY_DESCRIPTORS,
              false /* indexed */,
              true /* stored */,
              false /* tokenized */,
              true /* multivalued */,
              BasicTypes.STRING_TYPE));
  // @formatter:on

  @Override
  public Set<AttributeDescriptor> getAttributeDescriptors() {
    return ImmutableSet.copyOf(DESCRIPTORS.values());
  }

  @Override
  public AttributeDescriptor getAttributeDescriptor(String name) {
    return DESCRIPTORS.get(name);
  }

  @Override
  public String getName() {
    return NAME;
  }
}
