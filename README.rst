======================
EEA Annotator
======================
.. image:: http://ci.eionet.europa.eu/job/eea.annotator-www/badge/icon
  :target: http://ci.eionet.europa.eu/job/eea.annotator-www/lastBuild
.. image:: http://ci.eionet.europa.eu/job/eea.annotator-plone4/badge/icon
  :target: http://ci.eionet.europa.eu/job/eea.annotator-plone4/lastBuild

EEA Annotator is the Plone integration of http://okfnlabs.org/annotator/ which
allows your editors to easily collaborate on a Plone document by adding
annotations (inline comments) on it.

Contents
========

.. contents::


Main features
=============

1. Inline comments on any webpage.
2. Portal types aware. Possibility to enable inline comments only for certain
   content types.
3. Workflow aware. Possibility to enable/disable inline comments only
   for certain workflow states (via content rules).
4. Dexterity aware. It works also with dexterity content-types.
5. Contextually disable inline comments.

Install
=======

- Add eea.annotator to your eggs section in your buildout and re-run buildout.
  You can download a sample buildout from
  https://github.com/eea/eea.annotator/tree/master/buildouts/plone4
- Install eea.annotator within Site Setup > Add-ons

.. warning ::

  Once you'll install this add-on via Site Setup > Add-ons, it will
  overrides Publish Traversal for Archetypes base object
  (plone.app.imaging.interfaces.IBaseObject) and Dexterity Base Content
  (plone.dexterity.interfaces.IDexterityContent) in order to handle custom
  annotator URLs. Still, it preserves old functionality from plone.app.imaging
  and plone.dexterity (also eea.depiction) but if you have custom traversals
  registered for these interfaces, try to use custom browser layers when
  registering them (see: eea.annotator.browser.app.traverse).

Getting started
===============

1. Go to Plone Site Setup > EEA Annotator Settings and enable inline comments
   for your content-types (default enabled for Page);
2. Go to your work-space within Plone Site and add a new object (Page) or user
   an existing one;
3. In view mode select text you want to comment on and add an inline comment;
4. Within edit form > Settings Tab you can contextually disable inline comments.
5. You can also add an "Inline comments" portlet in order to overview
   all inline comments on this page.

Dexterity
---------
Dexterity content-types are supported by EEA Annotator.

1. In order to be able to contextually disable inline comments you need to add
   a boolean field called disableAnnotator within your Dexterity content-type
   schema fields.
2. In order to be able to contextually make inline comments read-only
   you need to add a boolean field called readOnlyAnnotator within your
   Dexterity content-type schema fields.
   (Plone Site Setup > Dexterity Content Types > MyCustomType > Fields)

Source code
===========

- Latest source code (Plone 4 compatible):
  https://github.com/collective/eea.annotator


Copyright and license
=====================
The Initial Owner of the Original Code is European Environment Agency (EEA).
All Rights Reserved.

The EEA Annotator (the Original Code) is free software;
you can redistribute it and/or modify it under the terms of the GNU
General Public License as published by the Free Software Foundation;
either version 2 of the License, or (at your option) any later
version.

More details under docs/License.txt


Funding
=======

EEA_ - European Environment Agency (EU)

.. _EEA: http://www.eea.europa.eu/
