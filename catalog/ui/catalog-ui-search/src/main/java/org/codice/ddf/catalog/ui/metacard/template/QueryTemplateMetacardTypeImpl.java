package org.codice.ddf.catalog.ui.metacard.template;

import ddf.catalog.data.AttributeDescriptor;
import ddf.catalog.data.Metacard;
import ddf.catalog.data.impl.AttributeDescriptorImpl;
import ddf.catalog.data.impl.BasicTypes;

import java.util.HashSet;
import java.util.Set;

public class QueryTemplateMetacardTypeImpl {

    public static final String QUERY_TEMPLATE_TAG = "queryTemplate";

    public static final String QUERY_METACARD_TYPE_NAME = "metacard.queryTemplate";

    public static final String QUERY_CQL = "cql";

    public static final String QUERY_PREDICATE_TREE_JSON = "PREDICATE_TREE";

    public static final String WHITE_LISTED_ATTRIBUTES = "WHITE_LISTED_ATTRS";

    public static final String WHITE_LISTED_DEFAULTS = "WHITE_LISTED_DEFAULTS";

//    public static final String QUERY_SOURCES = "sources";

//    public static final String QUERY_ENTERPRISE = "enterprise";

//    public static final String QUERY_SORT_ORDER = "sortOrder";

//    public static final String QUERY_SORT_FIELD = "sortField";

//    public static final String QUERY_POLLING = "polling";

//    public static final String QUERY_FEDERATION = "federation";

//    public static final String QUERY_TYPE = "type";

    private static final Set<AttributeDescriptor> QUERY_DESCRIPTORS;

    static {
        QUERY_DESCRIPTORS = new HashSet<>();

        QUERY_DESCRIPTORS.add(
                new AttributeDescriptorImpl(
                        Metacard.ID,
                        true /* indexed */,
                        true /* stored */,
                        false /* tokenized */,
                        false /* multivalued */,
                        BasicTypes.STRING_TYPE));

        QUERY_DESCRIPTORS.add(
                new AttributeDescriptorImpl(
                        Metacard.TITLE,
                        true /* indexed */,
                        true /* stored */,
                        false /* tokenized */,
                        false /* multivalued */,
                        BasicTypes.STRING_TYPE));

        QUERY_DESCRIPTORS.add(
                new AttributeDescriptorImpl(
                        QUERY_PREDICATE_TREE_JSON,
                        true /* indexed */,
                        true /* stored */,
                        false /* tokenized */,
                        false /* multivalued */,
                        BasicTypes.STRING_TYPE));

        QUERY_DESCRIPTORS.add(
                new AttributeDescriptorImpl(
                        WHITE_LISTED_ATTRIBUTES,
                        true /* indexed */,
                        true /* stored */,
                        false /* tokenized */,
                        false /* multivalued */,
                        BasicTypes.STRING_TYPE));

        QUERY_DESCRIPTORS.add(
                new AttributeDescriptorImpl(
                        WHITE_LISTED_DEFAULTS,
                        true /* indexed */,
                        true /* stored */,
                        false /* tokenized */,
                        false /* multivalued */,
                        BasicTypes.STRING_TYPE));
    }
}
