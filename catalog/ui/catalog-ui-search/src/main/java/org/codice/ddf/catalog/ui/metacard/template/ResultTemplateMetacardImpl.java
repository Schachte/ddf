package org.codice.ddf.catalog.ui.metacard.template;

import ddf.catalog.data.Attribute;
import ddf.catalog.data.Metacard;
import ddf.catalog.data.MetacardType;
import ddf.catalog.data.impl.MetacardImpl;
import ddf.catalog.data.impl.types.CoreAttributes;
import ddf.catalog.data.types.Core;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ResultTemplateMetacardImpl extends MetacardImpl {
  public ResultTemplateMetacardImpl(String title, String description) {
    super(new ResultTemplateMetacardTypeImpl());
    setAttribute(CoreAttributes.TITLE, title);
    setAttribute(CoreAttributes.DESCRIPTION, description);
    setTags(Collections.singleton(ResultTemplateAttributes.NAME));
  }

  public ResultTemplateMetacardImpl(String title, String description, String id) {
    this(title, description);
    setId(id);
  }

  public ResultTemplateMetacardImpl(Metacard metacard) {
    super(metacard);
  }

  protected ResultTemplateMetacardImpl(String title, String description, MetacardType type) {
    super(type);
    setAttribute(CoreAttributes.TITLE, title);
    setAttribute(CoreAttributes.DESCRIPTION, description);
  }

  /**
   * Check if a given metacard is a result template metacard by checking the tags metacard
   * attribute.
   *
   * @param metacard the metacard to check.
   * @return true if the provided metacard is a result template metacard, false otherwise.
   */
  public static boolean isResultTemplateMetacard(Metacard metacard) {
    return metacard != null
        && metacard.getTags().stream().anyMatch(ResultTemplateAttributes.NAME::equals);
  }

  /**
   * Compute the symmetric difference between the sharing permissions of two workspaces.
   *
   * @param m - metacard to diff against
   * @return
   */
  public Set<String> diffSharing(Metacard m) {
    //    if (isResultTemplateMetacard(m)) {
    //      return Sets.symmetricDifference(getSharing(), from(m).getSharing());
    //    }
    return Collections.emptySet();
  }

  protected List<String> getValues(String attribute) {
    Attribute attr = getAttribute(attribute);
    if (attr != null) {
      return attr.getValues().stream().map(String::valueOf).collect(Collectors.toList());
    }
    return Collections.emptyList();
  }

  public String getOwner() {
    List<String> values = getValues(Core.METACARD_OWNER);
    if (!values.isEmpty()) {
      return values.get(0);
    }
    return null;
  }

  public ResultTemplateMetacardImpl setOwner(String email) {
    setAttribute(Core.METACARD_OWNER, email);
    return this;
  }

  public Set<String> getSharing() {
    return new HashSet<>(getValues(ResultTemplateAttributes.TEMPLATE_SHARING));
  }

  public ResultTemplateMetacardImpl setSharing(Set<String> sharing) {
    setAttribute(ResultTemplateAttributes.TEMPLATE_SHARING, new ArrayList<>(sharing));
    return this;
  }

  public Set<String> getResultDescriptors() {
    return new HashSet<>(getValues(ResultTemplateAttributes.RESULT_DESCRIPTORS));
  }

  public ResultTemplateMetacardImpl setResultDescriptors(Set<String> resultDescriptors) {
    setAttribute(ResultTemplateAttributes.RESULT_DESCRIPTORS, new ArrayList<>(resultDescriptors));
    return this;
  }
}
