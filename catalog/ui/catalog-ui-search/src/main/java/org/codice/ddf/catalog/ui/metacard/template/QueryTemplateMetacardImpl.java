package org.codice.ddf.catalog.ui.metacard.template;

import ddf.catalog.data.Metacard;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class QueryTemplateMetacardImpl extends ResultTemplateMetacardImpl {
  public QueryTemplateMetacardImpl(String title, String description) {
    super(title, description, new QueryTemplateMetacardTypeImpl());
    setTags(Collections.singleton(QueryTemplateAttributes.NAME));
  }

  public QueryTemplateMetacardImpl(String title, String description, String id) {
    this(title, description);
    setId(id);
  }

  public QueryTemplateMetacardImpl(Metacard metacard) {
    super(metacard);
  }

  /**
   * Check if a given metacard is a query template metacard by checking the tags metacard attribute.
   *
   * @param metacard the metacard to check.
   * @return true if the provided metacard is a query template metacard, false otherwise.
   */
  public static boolean isQueryTemplateMetacard(Metacard metacard) {
    return metacard != null
        && metacard.getTags().stream().anyMatch(QueryTemplateAttributes.NAME::equals);
  }

  public String getTemplateCql() {
    List<String> values = getValues(QueryTemplateAttributes.TEMPLATE_CQL);
    if (!values.isEmpty()) {
      return values.get(0);
    }
    return null;
  }

  public QueryTemplateMetacardImpl setTemplateCql(String templateCql) {
    setAttribute(QueryTemplateAttributes.TEMPLATE_CQL, templateCql);
    return this;
  }

  public Set<String> getQueryDescriptors() {
    return new HashSet<>(getValues(QueryTemplateAttributes.QUERY_DESCRIPTORS));
  }

  public QueryTemplateMetacardImpl setQueryDescriptors(Set<String> queryDescriptors) {
    setAttribute(QueryTemplateAttributes.QUERY_DESCRIPTORS, new ArrayList<>(queryDescriptors));
    return this;
  }

  @Override
  public QueryTemplateMetacardImpl setResultDescriptors(Set<String> resultDescriptors) {
      setAttribute(ResultTemplateAttributes.RESULT_DESCRIPTORS, new ArrayList<>(resultDescriptors));
      return this;
  }
}
