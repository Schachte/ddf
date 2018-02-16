package org.codice.ddf.catalog.ui.metacard.template;

import com.google.common.collect.ImmutableSet;
import ddf.catalog.data.AttributeDescriptor;
import ddf.catalog.data.MetacardType;
import ddf.catalog.data.impl.types.CoreAttributes;
import ddf.catalog.data.impl.types.SecurityAttributes;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

public class QueryTemplateMetacardTypeImpl implements MetacardType {
  private static final Set<AttributeDescriptor> ATTRIBUTE_DESCRIPTORS =
      ImmutableSet.of(
              new CoreAttributes(),
              new SecurityAttributes(),
              new ResultTemplateAttributes(),
              new QueryTemplateAttributes())
          .stream()
          .map(MetacardType::getAttributeDescriptors)
          .flatMap(Collection::stream)
          .collect(Collectors.toSet());

  @Override
  public String getName() {
    return QueryTemplateAttributes.NAME;
  }

  @Override
  public Set<AttributeDescriptor> getAttributeDescriptors() {
    return ATTRIBUTE_DESCRIPTORS;
  }

  @Override
  public AttributeDescriptor getAttributeDescriptor(String s) {
    for (AttributeDescriptor attributeDescriptor : ATTRIBUTE_DESCRIPTORS) {
      if (attributeDescriptor.getName().equals(s)) {
        return attributeDescriptor;
      }
    }
    return null;
  }
}
