package org.codice.ddf.catalog.ui.metacard.template;

import ddf.catalog.data.Attribute;
import ddf.catalog.data.impl.MetacardImpl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class QueryTemplateMetacardImpl extends MetacardImpl {
    private static final QueryTemplateMetacardImpl TYPE = new QueryTemplateMetacardImpl();

    public QueryTemplateMetacardImpl() {
        super(TYPE);
        setTags(Collections.singleton(QueryTemplateMetacardTypeImpl.QUERY_TEMPLATE_TAG));
    }

    public QueryTemplateMetacardImpl(String title) {
        this();
        setTitle(title);
    }

    public void setWhiteListedAttributes(List<String> attributeList) {
        setAttribute(QueryTemplateMetacardTypeImpl.WHITE_LISTED_ATTRIBUTES, new ArrayList<>(attributeList));
    }

    public void setWhiteListedDefaults(List<String> attributeDefaults) {
        setAttribute(QueryTemplateMetacardTypeImpl.WHITE_LISTED_DEFAULTS, new ArrayList<>(attributeDefaults));
    }

    public void setPredicateTree(List<String> treeJsonBlob) {
        setAttribute(QueryTemplateMetacardTypeImpl.QUERY_PREDICATE_TREE_JSON, new ArrayList<>(treeJsonBlob));
    }

    public String getPredicateTree() {
        Attribute attribute = getAttribute(QueryTemplateMetacardTypeImpl.QUERY_PREDICATE_TREE_JSON);
        return (String) attribute.getValue();
    }

}
