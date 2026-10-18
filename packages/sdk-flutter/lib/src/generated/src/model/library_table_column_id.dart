//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_table_column_id.g.dart';

class LibraryTableColumnId extends EnumClass {

  @BuiltValueEnumConst(wireName: r'title')
  static const LibraryTableColumnId title = _$title;
  @BuiltValueEnumConst(wireName: r'labels')
  static const LibraryTableColumnId labels = _$labels;
  @BuiltValueEnumConst(wireName: r'date')
  static const LibraryTableColumnId date = _$date;
  @BuiltValueEnumConst(wireName: r'status')
  static const LibraryTableColumnId status = _$status;
  @BuiltValueEnumConst(wireName: r'folder')
  static const LibraryTableColumnId folder = _$folder;
  @BuiltValueEnumConst(wireName: r'updated')
  static const LibraryTableColumnId updated = _$updated;

  static Serializer<LibraryTableColumnId> get serializer => _$libraryTableColumnIdSerializer;

  const LibraryTableColumnId._(String name): super(name);

  static BuiltSet<LibraryTableColumnId> get values => _$values;
  static LibraryTableColumnId valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class LibraryTableColumnIdMixin = Object with _$LibraryTableColumnIdMixin;

