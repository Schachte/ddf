package org.codice.ddf.catalog.ui.metacard.template;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import ddf.catalog.data.AttributeDescriptor;
import ddf.catalog.data.MetacardType;
import ddf.catalog.data.impl.AttributeDescriptorImpl;
import ddf.catalog.data.impl.BasicTypes;
import ddf.catalog.data.types.Core;
import java.util.Map;
import java.util.Set;

public class ResultTemplateAttributes implements MetacardType {
  public static final String TEMPLATE_SHARING = "metacard.sharing";

  public static final String RESULT_DESCRIPTORS = "result_descriptors";

  public static final String NAME = "template_result";

  // @formatter:off
  private static final Map<String, AttributeDescriptor> DESCRIPTORS =
      ImmutableMap.of(
          Core.METACARD_OWNER,
          new AttributeDescriptorImpl(
              Core.METACARD_OWNER,
              true /* indexed */,
              true /* stored */,
              true /* tokenized */,
              false /* multivalued */,
              BasicTypes.STRING_TYPE),
          TEMPLATE_SHARING,
          new AttributeDescriptorImpl(
              TEMPLATE_SHARING,
              false /* indexed */,
              true /* stored */,
              false /* tokenized */,
              true /* multivalued */,
              BasicTypes.XML_TYPE),
          RESULT_DESCRIPTORS,
          new AttributeDescriptorImpl(
              RESULT_DESCRIPTORS,
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
