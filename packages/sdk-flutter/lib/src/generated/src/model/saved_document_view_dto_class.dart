//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/library_table_column_id.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_document_view_dto_class.g.dart';

/// SavedDocumentViewDtoClass
///
/// Properties:
/// * [visibleColumns] 
/// * [id] 
/// * [name] 
/// * [visibility] 
/// * [ownerUserId] 
/// * [searchQuery] 
/// * [sort] 
/// * [order] 
/// * [viewMode] 
/// * [filterMode] 
/// * [listScope] 
/// * [folderId] 
/// * [mappeId] 
/// * [correspondentId] 
/// * [status] 
/// * [inbox] 
/// * [withoutNonInboxLabel] 
/// * [tagIds] 
/// * [pinnedSidebar] 
/// * [position] 
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class SavedDocumentViewDtoClass implements Built<SavedDocumentViewDtoClass, SavedDocumentViewDtoClassBuilder> {
  @BuiltValueField(wireName: r'visibleColumns')
  BuiltList<LibraryTableColumnId> get visibleColumns;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'visibility')
  SavedDocumentViewDtoClassVisibilityEnum get visibility;
  // enum visibilityEnum {  private,  shared,  };

  @BuiltValueField(wireName: r'ownerUserId')
  String get ownerUserId;

  @BuiltValueField(wireName: r'searchQuery')
  String get searchQuery;

  @BuiltValueField(wireName: r'sort')
  SavedDocumentViewDtoClassSortEnum get sort;
  // enum sortEnum {  createdAt,  updatedAt,  title,  documentDate,  };

  @BuiltValueField(wireName: r'order')
  SavedDocumentViewDtoClassOrderEnum get order;
  // enum orderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'viewMode')
  SavedDocumentViewDtoClassViewModeEnum get viewMode;
  // enum viewModeEnum {  klassisch,  karten,  fokus,  };

  @BuiltValueField(wireName: r'filterMode')
  SavedDocumentViewDtoClassFilterModeEnum get filterMode;
  // enum filterModeEnum {  query,  ui,  };

  @BuiltValueField(wireName: r'listScope')
  SavedDocumentViewDtoClassListScopeEnum get listScope;
  // enum listScopeEnum {  all,  folder,  mappe,  };

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  @BuiltValueField(wireName: r'correspondentId')
  String? get correspondentId;

  @BuiltValueField(wireName: r'status')
  SavedDocumentViewDtoClassStatusEnum? get status;
  // enum statusEnum {  uploaded,  queued,  extracting,  ready,  failed,  };

  @BuiltValueField(wireName: r'inbox')
  bool? get inbox;

  @BuiltValueField(wireName: r'withoutNonInboxLabel')
  bool? get withoutNonInboxLabel;

  @BuiltValueField(wireName: r'tagIds')
  BuiltList<String> get tagIds;

  @BuiltValueField(wireName: r'pinnedSidebar')
  bool get pinnedSidebar;

  @BuiltValueField(wireName: r'position')
  num get position;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  SavedDocumentViewDtoClass._();

  factory SavedDocumentViewDtoClass([void updates(SavedDocumentViewDtoClassBuilder b)]) = _$SavedDocumentViewDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedDocumentViewDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedDocumentViewDtoClass> get serializer => _$SavedDocumentViewDtoClassSerializer();
}

class _$SavedDocumentViewDtoClassSerializer implements PrimitiveSerializer<SavedDocumentViewDtoClass> {
  @override
  final Iterable<Type> types = const [SavedDocumentViewDtoClass, _$SavedDocumentViewDtoClass];

  @override
  final String wireName = r'SavedDocumentViewDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedDocumentViewDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'visibleColumns';
    yield serializers.serialize(
      object.visibleColumns,
      specifiedType: const FullType(BuiltList, [FullType(LibraryTableColumnId)]),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'visibility';
    yield serializers.serialize(
      object.visibility,
      specifiedType: const FullType(SavedDocumentViewDtoClassVisibilityEnum),
    );
    yield r'ownerUserId';
    yield serializers.serialize(
      object.ownerUserId,
      specifiedType: const FullType(String),
    );
    yield r'searchQuery';
    yield serializers.serialize(
      object.searchQuery,
      specifiedType: const FullType(String),
    );
    yield r'sort';
    yield serializers.serialize(
      object.sort,
      specifiedType: const FullType(SavedDocumentViewDtoClassSortEnum),
    );
    yield r'order';
    yield serializers.serialize(
      object.order,
      specifiedType: const FullType(SavedDocumentViewDtoClassOrderEnum),
    );
    yield r'viewMode';
    yield serializers.serialize(
      object.viewMode,
      specifiedType: const FullType(SavedDocumentViewDtoClassViewModeEnum),
    );
    yield r'filterMode';
    yield serializers.serialize(
      object.filterMode,
      specifiedType: const FullType(SavedDocumentViewDtoClassFilterModeEnum),
    );
    yield r'listScope';
    yield serializers.serialize(
      object.listScope,
      specifiedType: const FullType(SavedDocumentViewDtoClassListScopeEnum),
    );
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
    if (object.mappeId != null) {
      yield r'mappeId';
      yield serializers.serialize(
        object.mappeId,
        specifiedType: const FullType(String),
      );
    }
    if (object.correspondentId != null) {
      yield r'correspondentId';
      yield serializers.serialize(
        object.correspondentId,
        specifiedType: const FullType(String),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(SavedDocumentViewDtoClassStatusEnum),
      );
    }
    if (object.inbox != null) {
      yield r'inbox';
      yield serializers.serialize(
        object.inbox,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withoutNonInboxLabel != null) {
      yield r'withoutNonInboxLabel';
      yield serializers.serialize(
        object.withoutNonInboxLabel,
        specifiedType: const FullType(bool),
      );
    }
    yield r'tagIds';
    yield serializers.serialize(
      object.tagIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'pinnedSidebar';
    yield serializers.serialize(
      object.pinnedSidebar,
      specifiedType: const FullType(bool),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(num),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedDocumentViewDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedDocumentViewDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'visibleColumns':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LibraryTableColumnId)]),
          ) as BuiltList<LibraryTableColumnId>;
          result.visibleColumns.replace(valueDes);
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'visibility':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassVisibilityEnum),
          ) as SavedDocumentViewDtoClassVisibilityEnum;
          result.visibility = valueDes;
          break;
        case r'ownerUserId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerUserId = valueDes;
          break;
        case r'searchQuery':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.searchQuery = valueDes;
          break;
        case r'sort':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassSortEnum),
          ) as SavedDocumentViewDtoClassSortEnum;
          result.sort = valueDes;
          break;
        case r'order':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassOrderEnum),
          ) as SavedDocumentViewDtoClassOrderEnum;
          result.order = valueDes;
          break;
        case r'viewMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassViewModeEnum),
          ) as SavedDocumentViewDtoClassViewModeEnum;
          result.viewMode = valueDes;
          break;
        case r'filterMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassFilterModeEnum),
          ) as SavedDocumentViewDtoClassFilterModeEnum;
          result.filterMode = valueDes;
          break;
        case r'listScope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassListScopeEnum),
          ) as SavedDocumentViewDtoClassListScopeEnum;
          result.listScope = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        case r'mappeId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mappeId = valueDes;
          break;
        case r'correspondentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correspondentId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SavedDocumentViewDtoClassStatusEnum),
          ) as SavedDocumentViewDtoClassStatusEnum;
          result.status = valueDes;
          break;
        case r'inbox':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.inbox = valueDes;
          break;
        case r'withoutNonInboxLabel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withoutNonInboxLabel = valueDes;
          break;
        case r'tagIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tagIds.replace(valueDes);
          break;
        case r'pinnedSidebar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.pinnedSidebar = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.position = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SavedDocumentViewDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedDocumentViewDtoClassBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class SavedDocumentViewDtoClassVisibilityEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'private')
  static const SavedDocumentViewDtoClassVisibilityEnum private = _$savedDocumentViewDtoClassVisibilityEnum_private;
  @BuiltValueEnumConst(wireName: r'shared')
  static const SavedDocumentViewDtoClassVisibilityEnum shared = _$savedDocumentViewDtoClassVisibilityEnum_shared;

  static Serializer<SavedDocumentViewDtoClassVisibilityEnum> get serializer => _$savedDocumentViewDtoClassVisibilityEnumSerializer;

  const SavedDocumentViewDtoClassVisibilityEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassVisibilityEnum> get values => _$savedDocumentViewDtoClassVisibilityEnumValues;
  static SavedDocumentViewDtoClassVisibilityEnum valueOf(String name) => _$savedDocumentViewDtoClassVisibilityEnumValueOf(name);
}

class SavedDocumentViewDtoClassSortEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'createdAt')
  static const SavedDocumentViewDtoClassSortEnum createdAt = _$savedDocumentViewDtoClassSortEnum_createdAt;
  @BuiltValueEnumConst(wireName: r'updatedAt')
  static const SavedDocumentViewDtoClassSortEnum updatedAt = _$savedDocumentViewDtoClassSortEnum_updatedAt;
  @BuiltValueEnumConst(wireName: r'title')
  static const SavedDocumentViewDtoClassSortEnum title = _$savedDocumentViewDtoClassSortEnum_title;
  @BuiltValueEnumConst(wireName: r'documentDate')
  static const SavedDocumentViewDtoClassSortEnum documentDate = _$savedDocumentViewDtoClassSortEnum_documentDate;

  static Serializer<SavedDocumentViewDtoClassSortEnum> get serializer => _$savedDocumentViewDtoClassSortEnumSerializer;

  const SavedDocumentViewDtoClassSortEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassSortEnum> get values => _$savedDocumentViewDtoClassSortEnumValues;
  static SavedDocumentViewDtoClassSortEnum valueOf(String name) => _$savedDocumentViewDtoClassSortEnumValueOf(name);
}

class SavedDocumentViewDtoClassOrderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const SavedDocumentViewDtoClassOrderEnum asc = _$savedDocumentViewDtoClassOrderEnum_asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const SavedDocumentViewDtoClassOrderEnum desc = _$savedDocumentViewDtoClassOrderEnum_desc;

  static Serializer<SavedDocumentViewDtoClassOrderEnum> get serializer => _$savedDocumentViewDtoClassOrderEnumSerializer;

  const SavedDocumentViewDtoClassOrderEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassOrderEnum> get values => _$savedDocumentViewDtoClassOrderEnumValues;
  static SavedDocumentViewDtoClassOrderEnum valueOf(String name) => _$savedDocumentViewDtoClassOrderEnumValueOf(name);
}

class SavedDocumentViewDtoClassViewModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'klassisch')
  static const SavedDocumentViewDtoClassViewModeEnum klassisch = _$savedDocumentViewDtoClassViewModeEnum_klassisch;
  @BuiltValueEnumConst(wireName: r'karten')
  static const SavedDocumentViewDtoClassViewModeEnum karten = _$savedDocumentViewDtoClassViewModeEnum_karten;
  @BuiltValueEnumConst(wireName: r'fokus')
  static const SavedDocumentViewDtoClassViewModeEnum fokus = _$savedDocumentViewDtoClassViewModeEnum_fokus;

  static Serializer<SavedDocumentViewDtoClassViewModeEnum> get serializer => _$savedDocumentViewDtoClassViewModeEnumSerializer;

  const SavedDocumentViewDtoClassViewModeEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassViewModeEnum> get values => _$savedDocumentViewDtoClassViewModeEnumValues;
  static SavedDocumentViewDtoClassViewModeEnum valueOf(String name) => _$savedDocumentViewDtoClassViewModeEnumValueOf(name);
}

class SavedDocumentViewDtoClassFilterModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'query')
  static const SavedDocumentViewDtoClassFilterModeEnum query = _$savedDocumentViewDtoClassFilterModeEnum_query;
  @BuiltValueEnumConst(wireName: r'ui')
  static const SavedDocumentViewDtoClassFilterModeEnum ui = _$savedDocumentViewDtoClassFilterModeEnum_ui;

  static Serializer<SavedDocumentViewDtoClassFilterModeEnum> get serializer => _$savedDocumentViewDtoClassFilterModeEnumSerializer;

  const SavedDocumentViewDtoClassFilterModeEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassFilterModeEnum> get values => _$savedDocumentViewDtoClassFilterModeEnumValues;
  static SavedDocumentViewDtoClassFilterModeEnum valueOf(String name) => _$savedDocumentViewDtoClassFilterModeEnumValueOf(name);
}

class SavedDocumentViewDtoClassListScopeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'all')
  static const SavedDocumentViewDtoClassListScopeEnum all = _$savedDocumentViewDtoClassListScopeEnum_all;
  @BuiltValueEnumConst(wireName: r'folder')
  static const SavedDocumentViewDtoClassListScopeEnum folder = _$savedDocumentViewDtoClassListScopeEnum_folder;
  @BuiltValueEnumConst(wireName: r'mappe')
  static const SavedDocumentViewDtoClassListScopeEnum mappe = _$savedDocumentViewDtoClassListScopeEnum_mappe;

  static Serializer<SavedDocumentViewDtoClassListScopeEnum> get serializer => _$savedDocumentViewDtoClassListScopeEnumSerializer;

  const SavedDocumentViewDtoClassListScopeEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassListScopeEnum> get values => _$savedDocumentViewDtoClassListScopeEnumValues;
  static SavedDocumentViewDtoClassListScopeEnum valueOf(String name) => _$savedDocumentViewDtoClassListScopeEnumValueOf(name);
}

class SavedDocumentViewDtoClassStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'uploaded')
  static const SavedDocumentViewDtoClassStatusEnum uploaded = _$savedDocumentViewDtoClassStatusEnum_uploaded;
  @BuiltValueEnumConst(wireName: r'queued')
  static const SavedDocumentViewDtoClassStatusEnum queued = _$savedDocumentViewDtoClassStatusEnum_queued;
  @BuiltValueEnumConst(wireName: r'extracting')
  static const SavedDocumentViewDtoClassStatusEnum extracting = _$savedDocumentViewDtoClassStatusEnum_extracting;
  @BuiltValueEnumConst(wireName: r'ready')
  static const SavedDocumentViewDtoClassStatusEnum ready = _$savedDocumentViewDtoClassStatusEnum_ready;
  @BuiltValueEnumConst(wireName: r'failed')
  static const SavedDocumentViewDtoClassStatusEnum failed = _$savedDocumentViewDtoClassStatusEnum_failed;

  static Serializer<SavedDocumentViewDtoClassStatusEnum> get serializer => _$savedDocumentViewDtoClassStatusEnumSerializer;

  const SavedDocumentViewDtoClassStatusEnum._(String name): super(name);

  static BuiltSet<SavedDocumentViewDtoClassStatusEnum> get values => _$savedDocumentViewDtoClassStatusEnumValues;
  static SavedDocumentViewDtoClassStatusEnum valueOf(String name) => _$savedDocumentViewDtoClassStatusEnumValueOf(name);
}

