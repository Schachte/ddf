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

import ddf.catalog.Constants;
import ddf.catalog.data.Metacard;
import ddf.catalog.operation.CreateRequest;
import ddf.catalog.operation.DeleteRequest;
import ddf.catalog.operation.OperationTransaction;
import ddf.catalog.operation.UpdateRequest;
import ddf.catalog.plugin.PluginExecutionException;
import ddf.catalog.plugin.PreIngestPlugin;
import ddf.catalog.plugin.StopProcessingException;
import ddf.security.SubjectIdentity;
import ddf.security.principal.GuestPrincipal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.commons.lang.StringUtils;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.codice.ddf.catalog.ui.metacard.sharing.ShareableMetacardImpl;

public class ShareablePreIngestPlugin implements PreIngestPlugin {

  private final SubjectIdentity subjectIdentity;

  public ShareablePreIngestPlugin(SubjectIdentity subjectIdentity) {
    this.subjectIdentity = subjectIdentity;
  }

  private static Map<String, ShareableMetacardImpl> getPreviousShareableMetacards(
      UpdateRequest request) {
    OperationTransaction operationTransaction =
        (OperationTransaction) request.getProperties().get(Constants.OPERATION_TRANSACTION_KEY);

    return operationTransaction
        .getPreviousStateMetacards()
        .stream()
        .filter(ShareableMetacardImpl::isShareableMetacard)
        .map(ShareableMetacardImpl::from)
        .collect(Collectors.toMap(Metacard::getId, m -> m));
  }

  /**
   * Ensures a shareable metacard has an owner.
   *
   * @param request the {@link CreateRequest} to process
   * @return
   * @throws PluginExecutionException
   * @throws StopProcessingException - if the current subject doesn't have an email attribute
   */
  @Override
  public CreateRequest process(CreateRequest request)
      throws PluginExecutionException, StopProcessingException {
    Subject ownerSubject = getSubject();
    final String owner = subjectIdentity.getUniqueIdentifier(ownerSubject);

    List<ShareableMetacardImpl> shareableMetacards =
        request
            .getMetacards()
            .stream()
            .filter(ShareableMetacardImpl::isShareableMetacard)
            .map(ShareableMetacardImpl::from)
            .filter(shareableMC -> StringUtils.isEmpty(shareableMC.getOwner()))
            .collect(Collectors.toList());

    if (!shareableMetacards.isEmpty() && isGuest(ownerSubject)) {
      throw new StopProcessingException("Guest user not allowed to create shareable resources");
    }

    shareableMetacards.stream().forEach(shareableMC -> shareableMC.setOwner(owner));

    return request;
  }

  /**
   * Ensures the owner attribute is always present.
   *
   * @param request the {@link UpdateRequest} to process
   * @return
   * @throws PluginExecutionException
   * @throws StopProcessingException
   */
  @Override
  @SuppressWarnings("squid:S1854" /*previous is used and makes the stream forEach more efficient*/)
  public UpdateRequest process(UpdateRequest request)
      throws PluginExecutionException, StopProcessingException {

    Map<String, ShareableMetacardImpl> previous = getPreviousShareableMetacards(request);

    request
        .getUpdates()
        .stream()
        .map(Map.Entry::getValue)
        .filter(ShareableMetacardImpl::isShareableMetacard)
        .map(ShareableMetacardImpl::from)
        .filter(shareableMC -> StringUtils.isEmpty(shareableMC.getOwner()))
        .forEach(shareableMC -> shareableMC.setOwner(previous.get(shareableMC.getId()).getOwner()));

    return request;
  }

  @Override
  public DeleteRequest process(DeleteRequest input)
      throws PluginExecutionException, StopProcessingException {
    return input;
  }

  protected Subject getSubject() {
    return SecurityUtils.getSubject();
  }

  private boolean isGuest(Subject subject) {
    return subject.getPrincipal() instanceof GuestPrincipal;
  }
}
