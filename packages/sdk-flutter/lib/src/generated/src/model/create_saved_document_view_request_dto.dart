//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/library_table_column_id.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_saved_document_view_request_dto.g.dart';

/// CreateSavedDocumentViewRequestDto
///
/// Properties:
/// * [visibleColumns] 
/// * [name] 
/// * [visibility] 
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
/// * [documentDateFrom] 
/// * [documentDateTo] 
/// * [tagIds] 
/// * [pinnedSidebar] 
@BuiltValue()
abstract class CreateSavedDocumentViewRequestDto implements Built<CreateSavedDocumentViewRequestDto, CreateSavedDocumentViewRequestDtoBuilder> {
  @BuiltValueField(wireName: r'visibleColumns')
  BuiltList<LibraryTableColumnId>? get visibleColumns;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'visibility')
  CreateSavedDocumentViewRequestDtoVisibilityEnum? get visibility;
  // enum visibilityEnum {  private,  shared,  };

  @BuiltValueField(wireName: r'searchQuery')
  String get searchQuery;

  @BuiltValueField(wireName: r'sort')
  CreateSavedDocumentViewRequestDtoSortEnum? get sort;
  // enum sortEnum {  updatedAt,  createdAt,  title,  documentDate,  };

  @BuiltValueField(wireName: r'order')
  CreateSavedDocumentViewRequestDtoOrderEnum? get order;
  // enum orderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'viewMode')
  CreateSavedDocumentViewRequestDtoViewModeEnum? get viewMode;
  // enum viewModeEnum {  klassisch,  karten,  fokus,  };

  @BuiltValueField(wireName: r'filterMode')
  CreateSavedDocumentViewRequestDtoFilterModeEnum? get filterMode;
  // enum filterModeEnum {  ui,  query,  };

  @BuiltValueField(wireName: r'listScope')
  CreateSavedDocumentViewRequestDtoListScopeEnum? get listScope;
  // enum listScopeEnum {  all,  folder,  mappe,  };

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  @BuiltValueField(wireName: r'correspondentId')
  String? get correspondentId;

  @BuiltValueField(wireName: r'status')
  CreateSavedDocumentViewRequestDtoStatusEnum? get status;
  // enum statusEnum {  uploaded,  queued,  extracting,  ready,  failed,  };

  @BuiltValueField(wireName: r'inbox')
  bool? get inbox;

  @BuiltValueField(wireName: r'withoutNonInboxLabel')
  bool? get withoutNonInboxLabel;

  @BuiltValueField(wireName: r'documentDateFrom')
  String? get documentDateFrom;

  @BuiltValueField(wireName: r'documentDateTo')
  String? get documentDateTo;

  @BuiltValueField(wireName: r'tagIds')
  BuiltList<String>? get tagIds;

  @BuiltValueField(wireName: r'pinnedSidebar')
  bool? get pinnedSidebar;

  CreateSavedDocumentViewRequestDto._();

  factory CreateSavedDocumentViewRequestDto([void updates(CreateSavedDocumentViewRequestDtoBuilder b)]) = _$CreateSavedDocumentViewRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateSavedDocumentViewRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateSavedDocumentViewRequestDto> get serializer => _$CreateSavedDocumentViewRequestDtoSerializer();
}

class _$CreateSavedDocumentViewRequestDtoSerializer implements PrimitiveSerializer<CreateSavedDocumentViewRequestDto> {
  @override
  final Iterable<Type> types = const [CreateSavedDocumentViewRequestDto, _$CreateSavedDocumentViewRequestDto];

  @override
  final String wireName = r'CreateSavedDocumentViewRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateSavedDocumentViewRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.visibleColumns != null) {
      yield r'visibleColumns';
      yield serializers.serialize(
        object.visibleColumns,
        specifiedType: const FullType(BuiltList, [FullType(LibraryTableColumnId)]),
      );
    }
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.visibility != null) {
      yield r'visibility';
      yield serializers.serialize(
        object.visibility,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoVisibilityEnum),
      );
    }
    yield r'searchQuery';
    yield serializers.serialize(
      object.searchQuery,
      specifiedType: const FullType(String),
    );
    if (object.sort != null) {
      yield r'sort';
      yield serializers.serialize(
        object.sort,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoSortEnum),
      );
    }
    if (object.order != null) {
      yield r'order';
      yield serializers.serialize(
        object.order,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoOrderEnum),
      );
    }
    if (object.viewMode != null) {
      yield r'viewMode';
      yield serializers.serialize(
        object.viewMode,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoViewModeEnum),
      );
    }
    if (object.filterMode != null) {
      yield r'filterMode';
      yield serializers.serialize(
        object.filterMode,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoFilterModeEnum),
      );
    }
    if (object.listScope != null) {
      yield r'listScope';
      yield serializers.serialize(
        object.listScope,
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoListScopeEnum),
      );
    }
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
        specifiedType: const FullType(CreateSavedDocumentViewRequestDtoStatusEnum),
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
    if (object.documentDateFrom != null) {
      yield r'documentDateFrom';
      yield serializers.serialize(
        object.documentDateFrom,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentDateTo != null) {
      yield r'documentDateTo';
      yield serializers.serialize(
        object.documentDateTo,
        specifiedType: const FullType(String),
      );
    }
    if (object.tagIds != null) {
      yield r'tagIds';
      yield serializers.serialize(
        object.tagIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.pinnedSidebar != null) {
      yield r'pinnedSidebar';
      yield serializers.serialize(
        object.pinnedSidebar,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateSavedDocumentViewRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateSavedDocumentViewRequestDtoBuilder result,
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
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoVisibilityEnum),
          ) as CreateSavedDocumentViewRequestDtoVisibilityEnum;
          result.visibility = valueDes;
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
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoSortEnum),
          ) as CreateSavedDocumentViewRequestDtoSortEnum;
          result.sort = valueDes;
          break;
        case r'order':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoOrderEnum),
          ) as CreateSavedDocumentViewRequestDtoOrderEnum;
          result.order = valueDes;
          break;
        case r'viewMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoViewModeEnum),
          ) as CreateSavedDocumentViewRequestDtoViewModeEnum;
          result.viewMode = valueDes;
          break;
        case r'filterMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoFilterModeEnum),
          ) as CreateSavedDocumentViewRequestDtoFilterModeEnum;
          result.filterMode = valueDes;
          break;
        case r'listScope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoListScopeEnum),
          ) as CreateSavedDocumentViewRequestDtoListScopeEnum;
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
            specifiedType: const FullType(CreateSavedDocumentViewRequestDtoStatusEnum),
          ) as CreateSavedDocumentViewRequestDtoStatusEnum;
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
        case r'documentDateFrom':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDateFrom = valueDes;
          break;
        case r'documentDateTo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDateTo = valueDes;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateSavedDocumentViewRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateSavedDocumentViewRequestDtoBuilder();
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

class CreateSavedDocumentViewRequestDtoVisibilityEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'private')
  static const CreateSavedDocumentViewRequestDtoVisibilityEnum private = _$createSavedDocumentViewRequestDtoVisibilityEnum_private;
  @BuiltValueEnumConst(wireName: r'shared')
  static const CreateSavedDocumentViewRequestDtoVisibilityEnum shared = _$createSavedDocumentViewRequestDtoVisibilityEnum_shared;

  static Serializer<CreateSavedDocumentViewRequestDtoVisibilityEnum> get serializer => _$createSavedDocumentViewRequestDtoVisibilityEnumSerializer;

  const CreateSavedDocumentViewRequestDtoVisibilityEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoVisibilityEnum> get values => _$createSavedDocumentViewRequestDtoVisibilityEnumValues;
  static CreateSavedDocumentViewRequestDtoVisibilityEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoVisibilityEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoSortEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'updatedAt')
  static const CreateSavedDocumentViewRequestDtoSortEnum updatedAt = _$createSavedDocumentViewRequestDtoSortEnum_updatedAt;
  @BuiltValueEnumConst(wireName: r'createdAt')
  static const CreateSavedDocumentViewRequestDtoSortEnum createdAt = _$createSavedDocumentViewRequestDtoSortEnum_createdAt;
  @BuiltValueEnumConst(wireName: r'title')
  static const CreateSavedDocumentViewRequestDtoSortEnum title = _$createSavedDocumentViewRequestDtoSortEnum_title;
  @BuiltValueEnumConst(wireName: r'documentDate')
  static const CreateSavedDocumentViewRequestDtoSortEnum documentDate = _$createSavedDocumentViewRequestDtoSortEnum_documentDate;

  static Serializer<CreateSavedDocumentViewRequestDtoSortEnum> get serializer => _$createSavedDocumentViewRequestDtoSortEnumSerializer;

  const CreateSavedDocumentViewRequestDtoSortEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoSortEnum> get values => _$createSavedDocumentViewRequestDtoSortEnumValues;
  static CreateSavedDocumentViewRequestDtoSortEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoSortEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoOrderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const CreateSavedDocumentViewRequestDtoOrderEnum asc = _$createSavedDocumentViewRequestDtoOrderEnum_asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const CreateSavedDocumentViewRequestDtoOrderEnum desc = _$createSavedDocumentViewRequestDtoOrderEnum_desc;

  static Serializer<CreateSavedDocumentViewRequestDtoOrderEnum> get serializer => _$createSavedDocumentViewRequestDtoOrderEnumSerializer;

  const CreateSavedDocumentViewRequestDtoOrderEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoOrderEnum> get values => _$createSavedDocumentViewRequestDtoOrderEnumValues;
  static CreateSavedDocumentViewRequestDtoOrderEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoOrderEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoViewModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'klassisch')
  static const CreateSavedDocumentViewRequestDtoViewModeEnum klassisch = _$createSavedDocumentViewRequestDtoViewModeEnum_klassisch;
  @BuiltValueEnumConst(wireName: r'karten')
  static const CreateSavedDocumentViewRequestDtoViewModeEnum karten = _$createSavedDocumentViewRequestDtoViewModeEnum_karten;
  @BuiltValueEnumConst(wireName: r'fokus')
  static const CreateSavedDocumentViewRequestDtoViewModeEnum fokus = _$createSavedDocumentViewRequestDtoViewModeEnum_fokus;

  static Serializer<CreateSavedDocumentViewRequestDtoViewModeEnum> get serializer => _$createSavedDocumentViewRequestDtoViewModeEnumSerializer;

  const CreateSavedDocumentViewRequestDtoViewModeEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoViewModeEnum> get values => _$createSavedDocumentViewRequestDtoViewModeEnumValues;
  static CreateSavedDocumentViewRequestDtoViewModeEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoViewModeEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoFilterModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ui')
  static const CreateSavedDocumentViewRequestDtoFilterModeEnum ui = _$createSavedDocumentViewRequestDtoFilterModeEnum_ui;
  @BuiltValueEnumConst(wireName: r'query')
  static const CreateSavedDocumentViewRequestDtoFilterModeEnum query = _$createSavedDocumentViewRequestDtoFilterModeEnum_query;

  static Serializer<CreateSavedDocumentViewRequestDtoFilterModeEnum> get serializer => _$createSavedDocumentViewRequestDtoFilterModeEnumSerializer;

  const CreateSavedDocumentViewRequestDtoFilterModeEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoFilterModeEnum> get values => _$createSavedDocumentViewRequestDtoFilterModeEnumValues;
  static CreateSavedDocumentViewRequestDtoFilterModeEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoFilterModeEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoListScopeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'all')
  static const CreateSavedDocumentViewRequestDtoListScopeEnum all = _$createSavedDocumentViewRequestDtoListScopeEnum_all;
  @BuiltValueEnumConst(wireName: r'folder')
  static const CreateSavedDocumentViewRequestDtoListScopeEnum folder = _$createSavedDocumentViewRequestDtoListScopeEnum_folder;
  @BuiltValueEnumConst(wireName: r'mappe')
  static const CreateSavedDocumentViewRequestDtoListScopeEnum mappe = _$createSavedDocumentViewRequestDtoListScopeEnum_mappe;

  static Serializer<CreateSavedDocumentViewRequestDtoListScopeEnum> get serializer => _$createSavedDocumentViewRequestDtoListScopeEnumSerializer;

  const CreateSavedDocumentViewRequestDtoListScopeEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoListScopeEnum> get values => _$createSavedDocumentViewRequestDtoListScopeEnumValues;
  static CreateSavedDocumentViewRequestDtoListScopeEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoListScopeEnumValueOf(name);
}

class CreateSavedDocumentViewRequestDtoStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'uploaded')
  static const CreateSavedDocumentViewRequestDtoStatusEnum uploaded = _$createSavedDocumentViewRequestDtoStatusEnum_uploaded;
  @BuiltValueEnumConst(wireName: r'queued')
  static const CreateSavedDocumentViewRequestDtoStatusEnum queued = _$createSavedDocumentViewRequestDtoStatusEnum_queued;
  @BuiltValueEnumConst(wireName: r'extracting')
  static const CreateSavedDocumentViewRequestDtoStatusEnum extracting = _$createSavedDocumentViewRequestDtoStatusEnum_extracting;
  @BuiltValueEnumConst(wireName: r'ready')
  static const CreateSavedDocumentViewRequestDtoStatusEnum ready = _$createSavedDocumentViewRequestDtoStatusEnum_ready;
  @BuiltValueEnumConst(wireName: r'failed')
  static const CreateSavedDocumentViewRequestDtoStatusEnum failed = _$createSavedDocumentViewRequestDtoStatusEnum_failed;

  static Serializer<CreateSavedDocumentViewRequestDtoStatusEnum> get serializer => _$createSavedDocumentViewRequestDtoStatusEnumSerializer;

  const CreateSavedDocumentViewRequestDtoStatusEnum._(String name): super(name);

  static BuiltSet<CreateSavedDocumentViewRequestDtoStatusEnum> get values => _$createSavedDocumentViewRequestDtoStatusEnumValues;
  static CreateSavedDocumentViewRequestDtoStatusEnum valueOf(String name) => _$createSavedDocumentViewRequestDtoStatusEnumValueOf(name);
}

