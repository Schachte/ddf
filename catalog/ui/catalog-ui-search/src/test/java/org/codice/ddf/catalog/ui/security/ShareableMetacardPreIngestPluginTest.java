/**
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
package org.codice.ddf.catalog.ui.security;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSortedSet;
import ddf.catalog.Constants;
import ddf.catalog.data.Metacard;
import ddf.catalog.data.impl.MetacardImpl;
import ddf.catalog.data.types.Core;
import ddf.catalog.operation.OperationTransaction;
import ddf.catalog.operation.UpdateRequest;
import ddf.catalog.operation.impl.CreateRequestImpl;
import ddf.catalog.operation.impl.OperationTransactionImpl;
import ddf.catalog.operation.impl.UpdateRequestImpl;
import ddf.security.SubjectIdentity;
import java.io.Serializable;
import java.util.Map;
import java.util.SortedSet;
import org.apache.shiro.subject.Subject;
import org.codice.ddf.catalog.ui.metacard.sharing.ShareableMetacardImpl;
import org.junit.Before;
import org.junit.Test;

public class ShareableMetacardPreIngestPluginTest {

  private static final String TEST_ID_ATTR =
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

  private SubjectIdentity subjectIdentity;

  @Before
  public void setUp() {
    subjectIdentity = mock(SubjectIdentity.class);
    when(subjectIdentity.getUniqueIdentifier(any())).thenReturn("owner");
  }

  private ShareableMetacardPreIngestPlugin makePlugin(Map<String, SortedSet<String>> attrs) {
    Subject subject = mock(Subject.class);

    return new ShareableMetacardPreIngestPlugin(subjectIdentity) {
      @Override
      protected Subject getSubject() {
        return subject;
      }
    };
  }

  @Test
  public void testCreateShouldIgnoreNonShareableMetacards() throws Exception {
    ShareableMetacardPreIngestPlugin wpip = makePlugin(ImmutableMap.of());
    Metacard metacard = new MetacardImpl();

    wpip.process(new CreateRequestImpl(metacard));
    assertThat(metacard.getAttribute(Core.METACARD_OWNER), nullValue());
  }

  @Test
  public void testCreateShareableSuccess() throws Exception {
    when(subjectIdentity.getIdentityAttribute()).thenReturn(TEST_ID_ATTR);
    Map<String, SortedSet<String>> attrs =
        ImmutableMap.of(TEST_ID_ATTR, ImmutableSortedSet.of("owner"));

    ShareableMetacardPreIngestPlugin wpip = makePlugin(attrs);
    ShareableMetacardImpl shareableMetacard = new ShareableMetacardImpl();

    wpip.process(new CreateRequestImpl(shareableMetacard));
    assertThat(shareableMetacard.getOwner(), is("owner"));
  }

  private UpdateRequest updateRequest(Metacard prev, Metacard next) {
    UpdateRequestImpl request = new UpdateRequestImpl(next.getId(), next);

    OperationTransactionImpl tx =
        new OperationTransactionImpl(
            OperationTransaction.OperationType.UPDATE, ImmutableList.of(prev));

    Map<String, Serializable> properties = ImmutableMap.of(Constants.OPERATION_TRANSACTION_KEY, tx);

    request.setProperties(properties);

    return request;
  }

  @Test
  public void testUpdateIgnoreNonShareableMetacards() throws Exception {
    ShareableMetacardPreIngestPlugin wpip = makePlugin(ImmutableMap.of());

    MetacardImpl prev = new MetacardImpl();
    prev.setId("id");
    prev.setAttribute(Core.METACARD_OWNER, "prev");
    MetacardImpl next = new MetacardImpl();
    next.setId("id");

    wpip.process(updateRequest(prev, next));
    assertThat(next.getAttribute(Core.METACARD_OWNER), nullValue());
  }

  @Test
  public void testUpdatePreserveOwner() throws Exception {
    ShareableMetacardPreIngestPlugin wpip = makePlugin(ImmutableMap.of());

    ShareableMetacardImpl prev = new ShareableMetacardImpl("id");
    ShareableMetacardImpl next = ShareableMetacardImpl.clone(prev);

    prev.setOwner("prev");

    assertThat(next.getOwner(), nullValue());
    wpip.process(updateRequest(prev, next));
    assertThat(next.getOwner(), is(prev.getOwner()));
  }

  @Test
  public void testUpdateAllowOwnerChange() throws Exception {
    ShareableMetacardPreIngestPlugin wpip = makePlugin(ImmutableMap.of());

    ShareableMetacardImpl prev = new ShareableMetacardImpl("id");
    ShareableMetacardImpl next = ShareableMetacardImpl.clone(prev);

    prev.setOwner("prev");
    next.setOwner("next");

    wpip.process(updateRequest(prev, next));
    assertThat(next.getOwner(), is("next"));
  }
}
